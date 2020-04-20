/**
 * App State Service
 * Used for detect App State and Net info and inactivity status
 */

import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import EventEmitter from 'events';

import LoggerService from '@services/LoggerService';

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

                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
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
}

export default new AppStateService();
