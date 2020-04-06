/**
 * App State Service
 * Used for detect App State and Net info and inactivity status
 * Also lock the screen on inactivity
 */

import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import EventEmitter from 'events';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers';
import { CoreRepository } from '@store/repositories';
import { LoggerService, NavigationService } from '@services';

export enum NetStateStatus {
    Connected = 'Connected',
    Disconnected = 'Disconnected',
}

export enum AppStateStatus {
    Active = 'Active',
    Background = 'Background',
    Inactive = 'Inactive',
}

class AppStateService extends EventEmitter {
    netStatus: NetStateStatus;
    prevAppState: AppStateStatus;
    currentAppState: AppStateStatus;
    locked: boolean;
    logger: any;

    constructor() {
        super();

        this.locked = false;
        this.netStatus = NetStateStatus.Connected;
        this.prevAppState = AppStateStatus.Inactive;
        this.currentAppState = AppStateStatus.Active;
        this.logger = LoggerService.createLogger('App State');
    }

    initialize = () => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            try {
                // setup listeners
                await this.setNetInfoListener();
                await this.setAppStateListener();

                // we just need to require the lock if user initialized the app the
                NavigationService.on('setRoot', (root: string) => {
                    if (root === 'DefaultStack') {
                        // check if the app need to be lock in app startup
                        this.checkLockScreen();

                        // this will listen for app state changes and will check if we need to lock the app
                        this.setLockRequireListener();
                    }
                });
                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    lockScreen = () => {
        // lock the app
        this.locked = true;
        Navigator.showOverlay(
            AppScreens.Overlay.Lock,
            {
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            {
                onUnlock: () => {
                    this.locked = false;
                },
            },
        );
    };

    checkLockScreen = async () => {
        if (!this.locked) {
            const coreSettings = CoreRepository.getSettings();
            CoreRepository.getTimeLastUnlocked()
                .then(passedMinutes => {
                    if (passedMinutes >= coreSettings.minutesAutoLock) {
                        // lock the app
                        this.lockScreen();
                    }
                })
                .catch(() => {
                    // on error lock the screen as well
                    this.lockScreen();
                });
        }
    };

    setNetState(isConnected: boolean) {
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
    }

    /*
     * record net info changes
     */
    setNetInfoListener() {
        return new Promise(resolve => {
            NetInfo.fetch()
                .then(state => {
                    this.setNetState(state.isConnected);
                })
                .finally(() => {
                    return resolve();
                });

            NetInfo.addEventListener(state => {
                this.setNetState(state.isConnected);
            });
        });
    }

    /*
     * record app state changes
     */
    setAppStateListener() {
        return new Promise(resolve => {
            AppState.addEventListener('change', nextAppState => {
                let appState;
                switch (nextAppState) {
                    case 'inactive':
                        appState = AppStateStatus.Inactive;
                        break;
                    case 'active':
                        appState = AppStateStatus.Active;
                        break;
                    case 'background':
                        appState = AppStateStatus.Background;
                        break;
                    default:
                        appState = AppStateStatus.Active;
                }

                if (this.currentAppState !== appState) {
                    this.prevAppState = this.currentAppState;
                    this.currentAppState = appState;
                    // emit the appStateChange event
                    this.emit('appStateChange', this.currentAppState);
                }
            });

            return resolve();
        });
    }

    setLockRequireListener() {
        this.on('appStateChange', () => {
            if (this.prevAppState === AppStateStatus.Background && this.currentAppState === AppStateStatus.Active) {
                this.checkLockScreen();
            }
        });
    }
}

export default new AppStateService();
