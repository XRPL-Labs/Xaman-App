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

import { SetFlagSecure, ExitApp, GetAppVersionCode, GetAppBuildNumber, IsDebugBuild } from '@common/helpers/app';

import Vault from '@common/libs/vault';

// Storage
import { CoreRepository } from '@store/repositories';
import DataStorage from '@store/storage';

// services
import * as services from '@services';

// Textencoder/decoder polyfill TextEncoder TextDecoder
// Needed for ripple-binary-codec/... isomorphic
import '@common/helpers/textencoder';

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
        this.logger = services.LoggerService.createLogger('App');
        this.initialized = false;
    }

    run() {
        // Listen for app launched event
        Navigation.events().registerAppLaunchedListener(() => {
            // start the app
            this.logger.debug(
                `Xaman version ${GetAppVersionCode()}_${GetAppBuildNumber()}_${IsDebugBuild() ? 'D' : 'R'}`,
            );
            this.logger.debug(`Device ${GetDeviceBrand()} - OS Version ${GetDeviceOSVersion()}`);

            // tasks need to run before booting the app
            let tasks = [];

            // if already initialized then soft boot
            // NOTE: this can happen if Activity is destroyed and re-initiated
            if (this.initialized) {
                tasks = [this.configure, this.reinstateServices];
            } else {
                tasks = [
                    this.checkup,
                    this.initializeStorage,
                    this.configure,
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
        // normalize error message
        const message = services.LoggerService.normalizeError(exception);

        if (message) {
            if (
                message.indexOf('Realm file decryption failed') > -1 ||
                message.indexOf('Could not decrypt data') > -1 ||
                message.indexOf('Could not decrypt bytes') > -1
            ) {
                Alert.alert('Error', ErrorMessages.storageDecryptionFailed, [
                    {
                        text: 'Try again later',
                        onPress: ExitApp,
                    },
                    { text: 'Wipe Xaman', style: 'destructive', onPress: this.wipeStorage },
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

        // if error is not caused from device being jail-broken or rooted then report error to the crashlytics
        if (![ErrorMessages.runningOnRootedDevice, ErrorMessages.runningOnJailBrokenDevice].includes(message)) {
            services.LoggerService.logError('APP_STARTUP_ERROR', exception);
        }
    };

    wipeStorage = () => {
        Prompt(
            'WARNING',
            'You are wiping Xaman, This action cannot be undone. Are you sure?',
            [
                {
                    text: 'No',
                },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: () => {
                        DataStorage.wipe();
                        ExitApp();
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
                    .catch((error) => {
                        this.logger.error('initializeServices', error);
                        reject(error);
                    });
            } catch (error) {
                reject(error);
                this.logger.error('initializeServices', error);
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
            } catch (error) {
                this.logger.error('reinstateServices', error);
                reject(error);
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

    // pre run code that needs to be run before app initialization
    checkup = () => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise<void>(async (resolve, reject) => {
            try {
                //  ====== check for device root or jailBroken ======
                if (Platform.OS === 'android') {
                    const isRooted = await IsDeviceRooted();
                    if (isRooted) {
                        reject(new Error(ErrorMessages.runningOnRootedDevice));
                        return;
                    }
                } else if (Platform.OS === 'ios') {
                    const isJailBroken = await IsDeviceJailBroken();
                    if (isJailBroken) {
                        reject(new Error(ErrorMessages.runningOnJailBrokenDevice));
                        return;
                    }
                }

                //  ====== check if we need to clean up the vault ======
                // NOTE: this is needed in case of app reinstall for iOS
                if (Platform.OS === 'ios' && !DataStorage.isDataStoreFileExist()) {
                    const storageEncryptionKeyExist = await Vault.isStorageEncryptionKeyExist();
                    // if data storage file doesn't exist, and we could find the storage encryption key in the vault
                    // we need to clear the vault
                    if (storageEncryptionKeyExist) {
                        await Vault.clearStorage();
                    }
                }

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
                // get core settings
                const coreSettings = CoreRepository.getSettings();

                /* ======================== TIMEZONE ==================================== */
                await GetDeviceTimeZone()
                    .then((tz: string) => {
                        this.logger.debug(`Timezone set to ${tz}`);
                        moment.tz.setDefault(tz);
                    })
                    .catch(() => {
                        this.logger.warn('Unable to get device timezone, fallback to default timezone');
                        // ignore in case of error
                    });

                /* ======================== LOCALE ==================================== */
                const Localize = require('@locale').default;

                // get device local settings
                const localeSettings = await GetDeviceLocaleSettings();

                // if there is a language set in the settings load the setting base on the settings
                if (coreSettings?.language) {
                    this.logger.debug(
                        `Settings [Locale]/[Currency]: ${coreSettings.language.toUpperCase()}/${coreSettings.currency}`,
                    );
                    Localize.setLocale(
                        coreSettings.language,
                        coreSettings.useSystemSeparators ? localeSettings : undefined,
                    );
                } else {
                    // app is not initialized yet, set to default device locale
                    this.logger.debug('Locale is not initialized, setting base on device settings');
                    const locale = Localize.setLocale(localeSettings.languageCode, localeSettings);
                    CoreRepository.saveSettings({ language: locale });
                }

                /* ======================== FlagSecure & LayoutAnimationExperimental =============================== */
                if (Platform.OS === 'android') {
                    // Enable Flag Secure if developer mode is not active
                    if (!coreSettings?.developerMode) {
                        SetFlagSecure(true);
                    }

                    // enable layout animation
                    if (UIManager.setLayoutAnimationEnabledExperimental) {
                        UIManager.setLayoutAnimationEnabledExperimental(true);
                    }
                }

                /* ======================== RTL & FONTS ==================================== */
                // disable RTL as we don't support it right now
                I18nManager.allowRTL(false);
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
