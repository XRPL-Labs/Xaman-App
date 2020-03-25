/**
 * Application class
 */
import { UIManager, Platform, Alert, NativeModules } from 'react-native';

// modules
import DeviceInfo from 'react-native-device-info';
import { Navigation } from 'react-native-navigation';

// helpers
import { Navigator } from '@common/helpers';

// Storage
import { CoreRepository } from '@store/repositories';
import StorageBackend from '@store/storage';

// Locale
import Localize from '@locale';

// screens
import * as screens from '@screens';
// services
import * as services from '@services';

import { NetStateStatus } from '@services/AppStateService';

export default class Application {
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
        this.logger.debug(`XUMM version ${DeviceInfo.getReadableVersion()}`);

        // on app start
        Navigation.events().registerAppLaunchedListener(() => {
            // if app initialized do not start the services again
            // boot the app
            if (this.initialized) {
                this.boot();
                return;
            }
            // all stuff we need to init before boot the app
            const waterfall = [
                this.configure,
                this.registerScreens,
                this.initializeStorage,
                this.loadAppLocale,
                this.initAppServices,
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
                .catch((e: any) => {
                    if (typeof e.toString === 'function') {
                        Alert.alert('Error', e.toString());
                    } else {
                        Alert.alert('Error', 'Unexpected error happened');
                    }
                });
        });
    }

    boot = () => {
        const { SocketService, AppStateService } = services;

        if (AppStateService.netStatus === NetStateStatus.Connected) {
            // first connect to the websocket
            SocketService.connect()
                .then(() => {
                    const core = CoreRepository.getSettings();

                    // if app initialized go to main screen
                    if (core && core.initialized) {
                        Navigator.startDefault();
                    } else {
                        Navigator.startOnboarding();
                    }
                })
                .catch(() => {
                    Navigator.startConnectionIssue();
                });
        } else {
            Navigator.startConnectionIssue();
        }
    };

    initializeStorage = () => {
        return this.storage.initialize();
    };

    initAppServices = () => {
        return new Promise((resolve, reject) => {
            try {
                const servicesPromise = [] as Array<Promise<any>>;
                Object.keys(services).map(key => {
                    // @ts-ignore
                    const service = services[key];
                    if (typeof service.initialize === 'function') {
                        servicesPromise.push(service.initialize());
                    }
                    return servicesPromise;
                });

                Promise.all(servicesPromise)
                    .then(() => {
                        resolve();
                    })
                    .catch(e => {
                        this.logger.error('initAppServices Error:', e);
                        reject(e);
                    });
            } catch (e) {
                this.logger.error('initAppServices Error:', e);
            }
        });
    };

    loadAppLocale = () => {
        return new Promise((resolve, reject) => {
            try {
                const core = CoreRepository.getSettings();

                if (!core) {
                    this.logger.debug('Locale is not initialized, using default EN');
                    return resolve();
                }

                this.logger.debug(`Locale set to: ${core.language.toUpperCase()}`);
                Localize.setLocale(core.language);

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    registerScreens = () => {
        return new Promise((resolve, reject) => {
            try {
                Object.keys(screens).map(key => {
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

    configure = () => {
        return new Promise((resolve, reject) => {
            try {
                const { UtilsModule } = NativeModules;

                // enable LayoutAnimation for android
                if (Platform.OS === 'android') {
                    // check for device root
                    UtilsModule.isRooted().then((rooted: boolean) => {
                        if (rooted && !__DEV__) {
                            return reject(new Error('For your security, XUMM cannot be opened on a rooted phone.'));
                        }

                        // set secure flag for the app
                        UtilsModule.flagSecure(true);

                        // enable layout animation
                        if (UIManager.setLayoutAnimationEnabledExperimental) {
                            UIManager.setLayoutAnimationEnabledExperimental(true);
                        }

                        return resolve();
                    });
                } else {
                    // check for device root
                    UtilsModule.isJailBroken().then((isJailBroken: boolean) => {
                        if (isJailBroken && !__DEV__) {
                            return reject(
                                new Error('For your security, XUMM cannot be opened on a Jail Broken phone.'),
                            );
                        }

                        return resolve();
                    });
                }

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };
}
