/**
 * Authentication Service
 */

import { NativeModules } from 'react-native';
import EventEmitter from 'events';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import CoreRepository from '@store/repositories/core';
import AccountRepository from '@store/repositories/account';

import AppService, { AppStateStatus } from '@services/AppService';
import BackendService from '@services/BackendService';
import NavigationService from '@services/NavigationService';
import LoggerService from '@services/LoggerService';

import Localize from '@locale';

/* Service  ==================================================================== */
class AuthenticationService extends EventEmitter {
    locked: boolean;
    postSuccess: Array<() => void>;
    appStateChangeListener: any;
    logger: any;

    constructor() {
        super();

        this.locked = false;
        this.logger = LoggerService.createLogger('App State');

        // functions needs to run after success auth
        this.postSuccess = [AppService.checkShowChangeLog, BackendService.ping];
    }

    initialize = () => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            try {
                // we just need to require the lock if user initialized the app the
                NavigationService.on('setRoot', (root: string) => {
                    if (root === 'DefaultStack') {
                        // this will listen for app state changes and will check if we need to lock the app
                        AppService.addListener('appStateChange', this.onAppStateChange);
                    } else {
                        // else remove listeners
                        AppService.removeListener('appStateChange', this.onAppStateChange);
                    }
                });
                return resolve();
            } catch (e) {
                return reject(e);
            }
        });
    };

    /**
     * run services/functions which needs to run after auth done
     */
    runAfterSuccessAuth = () => {
        setTimeout(() => {
            while (this.postSuccess.length) {
                this.postSuccess.shift().call(null);
            }
        }, 500);
    };

    /**
     * Get the latest real time base on device CPU ticks
     * @returns Promise<number>
     */
    getRealTime = (): Promise<number> => {
        const { UtilsModule } = NativeModules;
        return new Promise((resolve) => {
            UtilsModule.getElapsedRealtime().then((ts: string) => {
                return resolve(Number(ts));
            });
        });
    };

    /**
     * reset the entire app
     * WARNING: this action cannot be undo, used carefully
     */
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

    /**
     * Calculate who long the input should be blocked base on number of wrong attempts
     * @param  {number} attemptNumber latest wrong attempt
     * @returns number wait time in seconds
     */
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

    /**
     * Runs after success auth
     * @param  {number} ts?
     */
    onSuccessAuthentication = async (ts?: number) => {
        if (!ts) {
            ts = await this.getRealTime();
        }
        // change to unlocked
        this.locked = false;

        // reset everything
        CoreRepository.saveSettings({
            passcodeFailedAttempts: 0,
            lastPasscodeFailedTimestamp: 0,
            lastUnlockedTimestamp: ts,
        });

        // run services/functions need to run after success auth
        this.runAfterSuccessAuth();
    };

    /**
     * runs after wrong passcode input
     * @param  {any} coreSettings
     * @param  {number} ts?
     */
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
    /**
     * Get the time app should not accept new pin code entry
     * @param  {any} coreSettings?
     * @param  {number} ts? timestamp in seconds
     * @returns number
     */
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
    /**
     * Check if the given passcode is correct
     * @param  {string} passcode clear string passcode
     * @returns string encrypted passcode
     */
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

    /**
     * check if the app needs to be lock base on the latest lock time and user settings
     */
    checkLockScreen = async () => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve) => {
            if (this.locked) return resolve();

            const coreSettings = CoreRepository.getSettings();

            const realTime = await this.getRealTime();

            if (
                coreSettings.lastUnlockedTimestamp === 0 ||
                realTime < coreSettings.lastUnlockedTimestamp ||
                realTime - coreSettings.lastUnlockedTimestamp > coreSettings.minutesAutoLock * 60
            ) {
                // lock the app
                this.locked = true;
                await Navigator.showOverlay(AppScreens.Overlay.Lock, {
                    layout: {
                        backgroundColor: 'transparent',
                        componentBackgroundColor: 'transparent',
                    },
                });
            } else {
                // run services/functions need to run after success auth
                this.runAfterSuccessAuth();
            }

            return resolve();
        });
    };

    /**
     * Listen for app state change to check for lock the app
     */
    onAppStateChange = () => {
        if (
            AppService.prevAppState === AppStateStatus.Background &&
            AppService.currentAppState === AppStateStatus.Active
        ) {
            this.checkLockScreen();
        }
    };
}

export default new AuthenticationService();
