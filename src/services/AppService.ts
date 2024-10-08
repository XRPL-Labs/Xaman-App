/**
 * App Service
 * Used for detect App State and Net info and inactivity status
 */

import EventEmitter from 'events';
import { AppState, Alert, Linking, Platform, NativeModules, NativeEventEmitter } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

import Localize from '@locale';

import { GetAppVersionCode } from '@common/helpers/app';

import Preferences from '@common/libs/preferences';
import { VersionDiff } from '@common/utils/version';

import LoggerService, { LoggerInstance } from '@services/LoggerService';
import { WebLinks } from '@common/constants/endpoints';

/* Constants  ==================================================================== */
const { AppUtilsModule, AppUpdateModule } = NativeModules;

const Emitter = new NativeEventEmitter(AppUtilsModule);
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

/* Events  ==================================================================== */
export type AppServiceEvent = {
    appStateChange: (status: AppStateStatus, prevStatus: AppStateStatus) => void;
    netStateChange: (status: NetStateStatus, prevStatus: NetStateStatus) => void;
};

declare interface AppService {
    on<U extends keyof AppServiceEvent>(event: U, listener: AppServiceEvent[U]): this;
    off<U extends keyof AppServiceEvent>(event: U, listener: AppServiceEvent[U]): this;
    emit<U extends keyof AppServiceEvent>(event: U, ...args: Parameters<AppServiceEvent[U]>): boolean;
}
/* Service  ==================================================================== */
class AppService extends EventEmitter {
    netStatus: NetStateStatus;
    prevAppState?: AppStateStatus;
    currentAppState: AppStateStatus;
    private inactivityTimeout: any;
    private logger: LoggerInstance;

    constructor() {
        super();

        this.netStatus = NetStateStatus.Connected;
        this.prevAppState = undefined;
        this.currentAppState = AppStateStatus.Active;

        this.logger = LoggerService.createLogger('AppService');
    }

    initialize = () => {
        /* eslint-disable-next-line */
        return new Promise<void>(async (resolve, reject) => {
            try {
                // setup listeners
                await this.setNetInfoListener();
                await this.setAppStateListener();

                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    // check if we need to show the App change log
    // this screen will be shown after user update the app to the new version
    checkVersionChange = async () => {
        const currentVersionCode = GetAppVersionCode();
        const savedVersionCode = await Preferences.get(Preferences.keys.LATEST_VERSION_CODE);

        if (!savedVersionCode || VersionDiff(currentVersionCode, savedVersionCode) > 0) {
            // showChangeLogModal
            // Navigator.showOverlay<ChangeLogOverlayProps>(AppScreens.Overlay.ChangeLog, {
            //     version: currentVersionCode,
            // });

            // update the latest version code
            await Preferences.set(Preferences.keys.LATEST_VERSION_CODE, currentVersionCode);
        }
    };

    // check if update available for the app
    checkAppUpdate = async () => {
        AppUpdateModule.checkUpdate()
            .then(async (versionCode: number) => {
                // no new version is available
                if (!versionCode) return;

                const ignoredVersionCode = await Preferences.get(Preferences.keys.UPDATE_IGNORE_VERSION_CODE);

                // user already ignored this update
                if (ignoredVersionCode && `${versionCode}` === `${ignoredVersionCode}`) {
                    return;
                }

                // this method only works on android
                if (Platform.OS === 'android') {
                    AppUpdateModule.startUpdate().catch((error) => {
                        // user canceled this update
                        if (error.code === 'E_UPDATE_CANCELLED') {
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
                                onPress: () =>
                                    Preferences.set(Preferences.keys.UPDATE_IGNORE_VERSION_CODE, `${versionCode}`),
                                style: 'destructive',
                            },
                            {
                                text: Localize.t('global.update'),
                                onPress: () => Linking.openURL(WebLinks.AppleStoreLink),
                            },
                        ],
                        { cancelable: true },
                    );
                }
            })
            .catch((error) => {
                this.logger.warn('checkAppUpdate', error);
            });
    };

    setNetState = (isConnected: boolean) => {
        let newState: NetStateStatus;

        const prevState = this.netStatus;

        if (isConnected) {
            newState = NetStateStatus.Connected;
        } else {
            newState = NetStateStatus.Disconnected;
        }

        if (this.netStatus !== newState) {
            this.netStatus = newState;
            // emit the netStateChange event
            this.emit('netStateChange', newState, prevState);
        }
    };

    /*
     * record net info changes
     */
    setNetInfoListener = () => {
        return new Promise<void>((resolve) => {
            NetInfo.fetch()
                .then((state) => {
                    this.setNetState(state.isConnected ?? false);
                })
                .finally(() => {
                    resolve();
                });

            NetInfo.addEventListener((state) => {
                this.setNetState(state.isConnected ?? false);
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
        AppUtilsModule.timeoutEvent('timeout_event', 15000);

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
        return new Promise<void>((resolve) => {
            AppState.addEventListener('change', this.handleAppStateChange);
            resolve();
        });
    }
}

export default new AppService();
