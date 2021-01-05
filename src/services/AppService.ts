/**
 * App Service
 * Used for detect App State and Net info and inactivity status
 */
import EventEmitter from 'events';

import { AppState, Alert, Linking, Platform, NativeModules, NativeEventEmitter } from 'react-native';

import NetInfo from '@react-native-community/netinfo';

import Localize from '@locale';
import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { GetAppVersionCode } from '@common/helpers/device';

import Preferences from '@common/libs/preferences';
import { VersionDiff } from '@common/libs/utils';

import LoggerService from '@services/LoggerService';

/* Constants  ==================================================================== */
const { UtilsModule, AppUpdateModule } = NativeModules;

const Emitter = new NativeEventEmitter(UtilsModule);

/* Types  ==================================================================== */
export enum NetStateStatus {
    Connected = 'Connected',
    Disconnected = 'Disconnected',
}

export enum AppStateStatus {
    Active = 'Active',
    Background = 'Background',
    Inactive = 'Inactive',
}

// events
declare interface AppService {
    on(event: 'appStateChange', listener: (status: AppStateStatus, prevStatus: AppStateStatus) => void): this;
    on(event: string, listener: Function): this;
}

/* Service  ==================================================================== */
class AppService extends EventEmitter {
    netStatus: NetStateStatus;
    prevAppState: AppStateStatus;
    currentAppState: AppStateStatus;
    private inactivityTimeout: any;
    private logger: any;

    constructor() {
        super();

        this.netStatus = NetStateStatus.Connected;
        this.prevAppState = undefined;
        this.currentAppState = AppStateStatus.Active;

        this.logger = LoggerService.createLogger('AppState');
    }

    initialize = () => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            try {
                // setup listeners
                await this.setNetInfoListener();
                await this.setAppStateListener();

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    // check if we need to show the App change log
    // this log will be show after user update the app
    checkShowChangeLog = async () => {
        const currentVersionCode = GetAppVersionCode();
        const savedVersionCode = await Preferences.get(Preferences.keys.LATEST_VERSION_CODE);

        if (!savedVersionCode || VersionDiff(currentVersionCode, savedVersionCode) > 0) {
            // showChangeLogModal
            Navigator.showOverlay(
                AppScreens.Overlay.ChangeLog,
                {
                    overlay: {
                        handleKeyboardEvents: true,
                    },
                    layout: {
                        backgroundColor: 'transparent',
                        componentBackgroundColor: 'transparent',
                    },
                },
                { version: currentVersionCode },
            );

            // update the latest version code
            Preferences.set(Preferences.keys.LATEST_VERSION_CODE, currentVersionCode);
        }
    };

    // check if update available for the app
    checkAppUpdate = async () => {
        AppUpdateModule.checkUpdate()
            .then(async (versionCode: number) => {
                // if update available
                if (versionCode) {
                    const ignoredVersionCode = await Preferences.get(Preferences.keys.UPDATE_IGNORE_VERSION_CODE);

                    // user already ignored this update
                    if (`${versionCode}` === `${ignoredVersionCode}`) {
                        return;
                    }

                    // this method only works on android
                    if (Platform.OS === 'android') {
                        AppUpdateModule.startUpdate().catch((e: any) => {
                            // user canceled this update
                            if (e.code === 'E_UPDATE_CANCELLED') {
                                Preferences.set(Preferences.keys.UPDATE_IGNORE_VERSION_CODE, `${versionCode}`);
                            }
                        });
                    } else {
                        Alert.alert(
                            Localize.t('global.newVersion'),
                            Localize.t('global.versionNumberIsAvailableOnTheAppStore', { versionCode }),
                            [
                                {
                                    text: Localize.t('global.notNow'),
                                    onPress: () => Preferences.set(Preferences.keys.UPDATE_IGNORE_VERSION_CODE, `${versionCode}`),
                                    style: 'destructive',
                                },
                                {
                                    text: Localize.t('global.update'),
                                    onPress: () => Linking.openURL('https://apps.apple.com/us/app/id1492302343'),
                                },
                            ],
                            { cancelable: true },
                        );
                    }
                }
            })
            .catch(() => {
                // ignore
            });
    };

    setNetState = (isConnected: boolean) => {
        let netStatus = NetStateStatus.Disconnected;
        if (isConnected) {
            netStatus = NetStateStatus.Connected;
        } else {
            netStatus = NetStateStatus.Disconnected;
        }

        if (this.netStatus !== netStatus) {
            this.netStatus = netStatus;
            // emit the netStateChange event
            this.emit('netStateChange', this.netStatus);
        }
    };

    /*
     * record net info changes
     */
    setNetInfoListener = () => {
        return new Promise((resolve) => {
            NetInfo.fetch()
                .then((state) => {
                    this.setNetState(state.isConnected);
                })
                .finally(() => {
                    return resolve();
                });

            NetInfo.addEventListener((state) => {
                this.setNetState(state.isConnected);
            });
        });
    };

    onInactivityTimeout = (id: string) => {
        if (id === 'timeout_event') {
            // clear any listener
            this.stopInactivityListener();

            if (this.currentAppState !== AppStateStatus.Inactive) {
                this.prevAppState = this.currentAppState;
                this.currentAppState = AppStateStatus.Inactive;
                // emit the appStateChange event
                this.emit('appStateChange', this.currentAppState, this.prevAppState);
            }
        }
    };

    /*
     * start a timer to check for background inactivity
     */
    startInactivityTimer = () => {
        if (this.inactivityTimeout) {
            return;
        }

        // start timeout timer
        UtilsModule.timeoutEvent('timeout_event', 15000);

        // add event listener for timer
        this.inactivityTimeout = Emitter.addListener('Utils.timeout', this.onInactivityTimeout);
    };

    /*
     * stop the inactivity timer
     */
    stopInactivityListener = () => {
        if (this.inactivityTimeout) {
            this.inactivityTimeout.remove();
            this.inactivityTimeout = null;
        }
    };

    handleAppStateChange = (nextAppState: any) => {
        let appState;
        switch (nextAppState) {
            case 'active':
                appState = AppStateStatus.Active;
                break;
            case 'background':
                appState = AppStateStatus.Background;
                break;
            default:
                // ignore inactive state
                return;
        }

        // if changed
        if (this.currentAppState !== appState) {
            this.prevAppState = this.currentAppState;
            this.currentAppState = appState;

            // if the app is in background, start inactivity timer / stop it
            if (appState === AppStateStatus.Background) {
                this.startInactivityTimer();
            } else {
                this.stopInactivityListener();
            }

            // emit the appStateChange event
            this.emit('appStateChange', this.currentAppState, this.prevAppState);
        }
    };

    /*
     * init app state change  listener
     */
    setAppStateListener() {
        return new Promise((resolve) => {
            AppState.addEventListener('change', this.handleAppStateChange);
            return resolve();
        });
    }
}

export default new AppService();
