/**
 * Application class
 */

import moment from 'moment-timezone';

import { UIManager, I18nManager, Platform, Alert, Text, TextInput } from 'react-native';

import messaging from '@react-native-firebase/messaging';
import { Navigation } from 'react-native-navigation';

// constants
import { ErrorMessages } from '@common/constants';

// helpers
import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import {
    GetAppReadableVersion,
    GetDeviceTimeZone,
    GetDeviceLocaleSettings,
    GetDeviceId,
    GetSystemVersion,
    FlagSecure,
    IsDeviceJailBroken,
    IsDeviceRooted,
    ExitApp,
    RestartBundle,
} from '@common/helpers/device';

// Storage
import { CoreRepository } from '@store/repositories';
import StorageBackend from '@store/storage';

// services
import * as services from '@services';

messaging().setBackgroundMessageHandler(async () => {
    // FIXME: temporary fix for error
    // Invariant Violation: Module AppRegistry is not a registered callable module (calling startHeadlessTask)
});

/* Application  ==================================================================== */
class Application {
    storage: StorageBackend;
    initialized: boolean;
    logger: any;

    constructor() {
        this.storage = new StorageBackend();
        this.logger = services.LoggerService.createLogger('Application');
        this.initialized = false;
    }

    run() {
        // start the app
        this.logger.debug(`XUMM version ${GetAppReadableVersion()}`);
        this.logger.debug(`Device ${GetDeviceId()} - OS Version ${GetSystemVersion()}`);

        // on app start
        Navigation.events().registerAppLaunchedListener(() => {
            // if already initialized then boot
            // NOTE: this should never happen
            if (this.initialized) {
                this.boot();
                return;
            }

            // all stuff we need to init before boot the app
            const waterfall = [
                this.configure,
                this.initializeStorage,
                this.loadAppLocale,
                this.initServices,
                this.registerScreens,
            ];

            // run them in waterfall
            waterfall
                .reduce((accumulator: any, callback) => {
                    return accumulator.then(callback);
                }, Promise.resolve())
                .then(() => {
                    // if everything went well boot the app
                    this.initialized = true;
                    this.boot();
                })
                .catch(this.handleError);
        });
    }

    // handle errors in app startup
    handleError = (exception: any) => {
        const message = services.LoggerService.normalizeError(exception);
        if (message) {
            if (message.indexOf('Realm file decryption failed') > -1) {
                Alert.alert('Error', ErrorMessages.storageDecryptionFailed, [
                    {
                        text: 'Try again later',
                        onPress: ExitApp,
                    },
                    { text: 'WIPE XUMM', style: 'destructive', onPress: this.wipeStorage },
                ]);
            } else if (message.indexOf('Encrypted interprocess sharing is currently unsupported') > -1) {
                Alert.alert('Error', ErrorMessages.appAlreadyRunningInDifferentProcess, [
                    {
                        text: 'Quite',
                        onPress: ExitApp,
                    },
                ]);
            } else {
                Alert.alert('Error', message);
            }
        } else {
            Alert.alert('Error', 'Unexpected error happened');
        }

        // services.LoggerService.recordError('APP RUN ERROR', exception);
    };

    wipeStorage = () => {
        Prompt(
            'WARNING',
            'You are wiping XUMM, This action cannot be undone. Are you sure?',
            [
                {
                    text: 'No',
                },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: () => {
                        this.storage.wipe();
                        RestartBundle();
                    },
                },
            ],
            { type: 'default' },
        );
    };

    // boot the app
    boot = () => {
        const { AuthenticationService } = services;

        const core = CoreRepository.getSettings();

        // if app initialized go to main screen
        if (core && core.initialized) {
            // check if the app should be locked
            // lock the app and the start the app
            AuthenticationService.checkLockScreen().then(() => {
                Navigator.startDefault();
            });
        } else {
            Navigator.startOnboarding();
        }
    };

    // initialize the storage
    initializeStorage = () => {
        return this.storage.initialize();
    };

    // initialize all the services
    initServices = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                const coreSettings = CoreRepository.getSettings();
                const servicesPromise = [] as Array<Promise<any>>;
                Object.keys(services).map((key) => {
                    // @ts-ignore
                    const service = services[key];
                    if (typeof service.initialize === 'function') {
                        servicesPromise.push(service.initialize(coreSettings));
                    }
                    return servicesPromise;
                });

                Promise.all(servicesPromise)
                    .then(() => {
                        resolve();
                    })
                    .catch((e) => {
                        this.logger.error('initServices Error:', e);
                        reject(e);
                    });
            } catch (e) {
                this.logger.error('initServices Error:', e);
            }
        });
    };

    // load app locals and settings
    loadAppLocale = () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
            try {
                const Localize = require('@locale').default;

                const core = CoreRepository.getSettings();

                const localeSettings = await GetDeviceLocaleSettings();

                // app is not initialized yet, set to default device locale
                if (!core) {
                    this.logger.debug('Locale is not initialized, setting base on device languageCode');
                    const locale = Localize.setLocale(localeSettings.languageCode, localeSettings);
                    CoreRepository.saveSettings({ language: locale });
                } else {
                    // use locale set in settings
                    this.logger.debug(`Locale set to: ${core.language.toUpperCase()}`);
                    Localize.setLocale(core.language, core.useSystemSeparators ? localeSettings : undefined);
                }
                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    // register all screens
    registerScreens = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                // load the screens
                const screens = require('./screens');

                // register
                Object.keys(screens).map((key) => {
                    // @ts-ignore
                    const Screen = screens[key];
                    Navigation.registerComponent(Screen.screenName, () => Screen);
                    return true;
                });
                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    // configure app settings
    configure = () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
            try {
                if (Platform.OS === 'android') {
                    // check for device root
                    await IsDeviceRooted().then((rooted: boolean) => {
                        if (rooted && !__DEV__) {
                            return reject(new Error('For your security, XUMM cannot be opened on a rooted phone.'));
                        }

                        // set secure flag for the app by default
                        FlagSecure(true);

                        // enable layout animation
                        if (UIManager.setLayoutAnimationEnabledExperimental) {
                            UIManager.setLayoutAnimationEnabledExperimental(true);
                        }

                        return true;
                    });
                } else if (Platform.OS === 'ios') {
                    // check for device root
                    await IsDeviceJailBroken().then((isJailBroken: boolean) => {
                        if (isJailBroken && !__DEV__) {
                            return reject(
                                new Error('For your security, XUMM cannot be opened on a Jail Broken phone.'),
                            );
                        }

                        return true;
                    });
                }

                // disable RTL as we don't support it right now
                I18nManager.allowRTL(false);

                // set timezone
                await GetDeviceTimeZone()
                    .then((tz: string) => {
                        this.logger.debug(`Timezone set to ${tz}`);
                        moment.tz.setDefault(tz);
                    })
                    .catch(() => {
                        this.logger.war('Unable to get device timezone, fallback to default timezone');
                        // ignore in case of error
                    });

                // Disable accessibility fonts
                // @ts-ignore
                Text.defaultProps = {};
                // @ts-ignore
                Text.defaultProps.allowFontScaling = false;
                // @ts-ignore
                TextInput.defaultProps = {};
                // @ts-ignore
                TextInput.defaultProps.allowFontScaling = false;

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };
}

export default new Application();
