/**
 * Authentication Service
 */

import { NativeModules } from 'react-native';
import EventEmitter from 'events';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import CoreRepository from '@store/repositories/core';
import AccountRepository from '@store/repositories/account';

import AppStateService, { AppStateStatus } from '@services/AppStateService';
import NavigationService from '@services/NavigationService';
import LoggerService from '@services/LoggerService';

import Localize from '@locale';

class AuthenticationService extends EventEmitter {
    locked: boolean;
    logger: any;

    constructor() {
        super();

        this.locked = false;
        this.logger = LoggerService.createLogger('App State');
    }

    initialize = () => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            try {
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

    getRealTime = (): Promise<number> => {
        const { UtilsModule } = NativeModules;
        return new Promise(resolve => {
            UtilsModule.getElapsedRealtime().then((ts: string) => {
                return resolve(Number(ts));
            });
        });
    };

    resetApp = () => {
        // purge all account private keys
        AccountRepository.purgePrivateKeys();

        // clear the storage
        CoreRepository.purge();

        // dismiss any modal or overlay
        Navigator.dismissModal();
        Navigator.dismissOverlay();

        // go to onboarding
        Navigator.startOnboarding();
    };

    calculateWrongAttemptWaitTime = (attemptNumber: number): number => {
        if (attemptNumber < 6) return 0;

        switch (attemptNumber) {
            case 6:
                return 1 * 60;
            case 7:
                return 5 * 60;
            case 8:
                return 15 * 60;
            case 9:
                return 60 * 60;
            default:
                return 120 * 60;
        }
    };

    onSuccessAuthentication = async (ts?: number) => {
        if (!ts) {
            ts = await this.getRealTime();
        }
        // change to unlocked
        this.locked = false;

        // passcode is correct
        CoreRepository.saveSettings({
            passcodeFailedAttempts: 0,
            lastPasscodeFailedTimestamp: 0,
            lastUnlockedTimestamp: ts,
        });
    };

    onWrongPasscodeInput = async (coreSettings: any, ts?: number) => {
        if (!ts) {
            ts = await this.getRealTime();
        }
        // TODO: check for purge on too many failed attempt
        CoreRepository.saveSettings({
            passcodeFailedAttempts: coreSettings.passcodeFailedAttempts + 1,
            lastPasscodeFailedTimestamp: ts,
        });

        if (coreSettings.purgeOnBruteForce) {
            // alert user next attempt will be wipe the app
            if (coreSettings.passcodeFailedAttempts + 1 === 10) {
                // alert
                Navigator.showAlertModal({
                    type: 'error',
                    title: Localize.t('global.critical'),
                    text: Localize.t('global.autoWipeAlert', { times: coreSettings.passcodeFailedAttempts + 1 }),
                    buttons: [
                        {
                            text: Localize.t('global.dismiss'),
                            onPress: () => {},
                            light: false,
                        },
                    ],
                });
            }

            if (coreSettings.passcodeFailedAttempts + 1 > 10) {
                // wipe/reset the app
                this.resetApp();
            }
        }
    };

    getInputBlockTime = async (coreSettings?: any, ts?: number): Promise<number> => {
        if (!coreSettings) {
            coreSettings = CoreRepository.getSettings();
        }

        if (!ts) {
            ts = await this.getRealTime();
        }

        const realTime = await this.getRealTime();
        // check if attempts is exceed
        if (coreSettings.passcodeFailedAttempts > 5) {
            // calculate potential wait time
            const waitTime = this.calculateWrongAttemptWaitTime(coreSettings.passcodeFailedAttempts);

            // device is rebooted , we cannot calculate the wait time
            if (realTime < coreSettings.lastPasscodeFailedTimestamp) {
                CoreRepository.saveSettings({
                    lastPasscodeFailedTimestamp: realTime,
                });

                return Math.floor(waitTime / 60);
            }

            const blockTime = coreSettings.lastPasscodeFailedTimestamp + waitTime - realTime;

            // entering passcode is still blocked
            if (blockTime > 0) {
                return Math.floor(blockTime / 60);
            }
        }

        return 0;
    };

    checkPasscode = (passcode: string): Promise<string> => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            const coreSettings = CoreRepository.getSettings();

            const realTime = await this.getRealTime();

            // check if passcode input is blocked
            const blockTime = await this.getInputBlockTime(coreSettings, realTime);

            if (blockTime) {
                return reject(new Error(Localize.t('global.tooManyAttempts', { after: blockTime })));
            }

            // get encrypted passcode from clear passcode
            const encryptedPasscode = await CoreRepository.encryptedPasscode(passcode);

            // check if passcode is correct
            if (encryptedPasscode === coreSettings.passcode) {
                this.onSuccessAuthentication(realTime);
                // resolve
                return resolve(encryptedPasscode);
            }

            this.onWrongPasscodeInput(coreSettings, realTime);

            return reject(new Error(Localize.t('global.invalidPasscode')));
        });
    };

    lockScreen = () => {
        // lock the app
        this.locked = true;
        Navigator.showOverlay(AppScreens.Overlay.Lock, {
            layout: {
                backgroundColor: 'transparent',
                componentBackgroundColor: 'transparent',
            },
        });
    };

    checkLockScreen = async () => {
        if (this.locked) return;

        const coreSettings = CoreRepository.getSettings();

        const realTime = await this.getRealTime();

        if (
            coreSettings.lastUnlockedTimestamp === 0 ||
            realTime < coreSettings.lastUnlockedTimestamp ||
            realTime - coreSettings.lastUnlockedTimestamp > coreSettings.minutesAutoLock * 60
        ) {
            this.lockScreen();
        }
    };

    setLockRequireListener() {
        AppStateService.on('appStateChange', () => {
            if (
                AppStateService.prevAppState === AppStateStatus.Background &&
                AppStateService.currentAppState === AppStateStatus.Active
            ) {
                this.checkLockScreen();
            }
        });
    }
}

export default new AuthenticationService();
