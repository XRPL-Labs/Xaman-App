/**
 * App Service
 * Used for detect App State and Net info and inactivity status
 */
import EventEmitter from 'events';

import { AppState } from 'react-native';

import NetInfo from '@react-native-community/netinfo';
import DeviceInfo from 'react-native-device-info';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';

import Preferences from '@common/libs/preferences';
import { VersionDiff } from '@common/libs/utils';

import LoggerService from '@services/LoggerService';

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

/* Service  ==================================================================== */
class AppService extends EventEmitter {
    netStatus: NetStateStatus;
    prevAppState: AppStateStatus;
    currentAppState: AppStateStatus;
    logger: any;

    constructor() {
        super();

        this.netStatus = NetStateStatus.Connected;
        this.prevAppState = AppStateStatus.Inactive;
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

    checkShowChangeLog = async () => {
        const currentVersionCode = DeviceInfo.getVersion();
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
    }

    /*
     * record app state changes
     */
    setAppStateListener() {
        return new Promise((resolve) => {
            AppState.addEventListener('change', (nextAppState) => {
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

export default new AppService();
