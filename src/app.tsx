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
    GetDeviceTimeZone,
    GetDeviceLocaleSettings,
    GetDeviceBrand,
    GetDeviceOSVersion,
    IsDeviceJailBroken,
    IsDeviceRooted,
} from '@common/helpers/device';

import {
    SetFlagSecure,
    ExitApp,
    RestartBundle,
    GetAppVersionCode,
    GetAppBuildNumber,
    IsDebugBuild,
} from '@common/helpers/app';

// Storage
import { CoreRepository } from '@store/repositories';
import DataStorage from '@store/storage';

// services
import * as services from '@services';

messaging().setBackgroundMessageHandler(async () => {
    // FIXME: temporary fix for error
    // Invariant Violation: Module AppRegistry is not a registered callable module (calling startHeadlessTask)
});

/* Application  ==================================================================== */
class Application {
    private storage: DataStorage;
    private initialized: boolean;
    private logger: any;

    constructor() {
        this.storage = new DataStorage();
        this.logger = services.LoggerService.createLogger('Application');
        this.initialized = false;
    }

    run() {
        // Listen for app launched event
        Navigation.events().registerAppLaunchedListener(() => {
            // start the app
            this.logger.debug(
                `XUMM version ${GetAppVersionCode()}_${GetAppBuildNumber()}_${IsDebugBuild() ? 'D' : 'R'}`,
            );
            this.logger.debug(`Device ${GetDeviceBrand()} - OS Version ${GetDeviceOSVersion()}`);

            // tasks need to run before booting the app
            let tasks = [];

            // if already initialized then soft boot
            // NOTE: this can happen if Activity is destroyed and re-initiated
            if (this.initialized) {
                tasks = [this.configure, this.loadAppLocale, this.reinstateServices];
            } else {
                tasks = [
                    this.configure,
                    this.initializeStorage,
                    this.loadAppLocale,
                    this.initializeServices,
                    this.registerScreens,
                ];
            }

            // run them in waterfall
            tasks
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
    handleError = (exception: Error) => {
        const message = services.LoggerService.normalizeError(exception);
        if (message) {
            if (
                message.indexOf('Realm file decryption failed') > -1 ||
                message.indexOf('Could not decrypt bytes') > -1
            ) {
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
                        text: 'Quit',
                        onPress: ExitApp,
                    },
                ]);
            } else {
                Alert.alert('Error', message);
            }
        } else {
            Alert.alert('Error', 'Unexpected error happened');
        }

        services.LoggerService.recordError('APP_STARTUP_ERROR', exception);
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
    initializeServices = () => {
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
                        this.logger.error('initializeServices Error:', e);
                        reject(e);
                    });
            } catch (e) {
                this.logger.error('initializeServices Error:', e);
            }
        });
    };

    // reinstate services
    reinstateServices = () => {
        return new Promise<void>((resolve, reject) => {
            try {
                Object.keys(services).forEach((key) => {
                    // @ts-ignore
                    const service = services[key];
                    if (typeof service.reinstate === 'function') {
                        service.reinstate();
                    }
                });
                resolve();
            } catch (e: any) {
                this.logger.error('reinstate Services Error:', e);
                reject(e);
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
                resolve();
            } catch (e) {
                reject(e);
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
                resolve();
            } catch (e) {
                reject(e);
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
                            return reject(new Error(ErrorMessages.runningOnRootedDevice));
                        }

                        // set secure flag for the app by default
                        SetFlagSecure(true);

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
                            return reject(new Error(ErrorMessages.runningOnJailBrokenDevice));
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

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };
}

export default new Application();
