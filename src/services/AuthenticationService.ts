/**
 * Authentication Service
 */
import EventEmitter from 'events';
import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import { GetElapsedRealtime } from '@common/helpers/device';
import { ExitApp } from '@common/helpers/app';

import { Biometric, BiometricErrors } from '@common/libs/biometric';
import Vault from '@common/libs/vault';

import DataStorage from '@store/storage';
import { BiometryType } from '@store/types';
import CoreRepository from '@store/repositories/core';

import AppService from '@services/AppService';
import NavigationService, { RootType } from '@services/NavigationService';
import BackendService from '@services/BackendService';
import LoggerService, { LoggerInstance } from '@services/LoggerService';
import LinkingService from '@services/LinkingService';
import PushNotificationsService from '@services/PushNotificationsService';

import Localize from '@locale';

import { Props as LockOverlayProps } from '@screens/Overlay/Lock/types';

/* Types  ==================================================================== */
export enum LockStatus {
    LOCKED = 'LOCKED',
    UNLOCKED = 'UNLOCKED',
}

/* Events  ==================================================================== */
export type AuthenticationServiceEvent = {
    lockStateChange: (state: LockStatus) => void;
};

declare interface AuthenticationService {
    on<U extends keyof AuthenticationServiceEvent>(event: U, listener: AuthenticationServiceEvent[U]): this;
    off<U extends keyof AuthenticationServiceEvent>(event: U, listener: AuthenticationServiceEvent[U]): this;
    emit<U extends keyof AuthenticationServiceEvent>(
        event: U,
        ...args: Parameters<AuthenticationServiceEvent[U]>
    ): boolean;
}
/* Service  ==================================================================== */
class AuthenticationService extends EventEmitter {
    private lockStatus: LockStatus;
    private postSuccess: Array<() => void>;
    private logger: LoggerInstance;

    constructor() {
        super();

        this.logger = LoggerService.createLogger('Authentication');

        // track the status of app is locked
        this.lockStatus = LockStatus.UNLOCKED;

        // list of methods that needs to run after success auth
        this.postSuccess = [
            AppService.checkVersionChange,
            AppService.checkAppUpdate,
            BackendService.sync,
            LinkingService.checkInitialDeepLink,
            PushNotificationsService.checkInitialNotification,
        ];
    }

    initialize = () => {
        /* eslint-disable-next-line */
        return new Promise<void>(async (resolve, reject) => {
            try {
                // we just need to require the lock if user initialized the app the
                NavigationService.on('setRoot', this.onRootChanged);
                // resolve
                resolve();
            } catch (e) {
                reject(e);
            }
        });
    };

    /**
     * On app root changed/set
     */
    private onRootChanged = (root: RootType) => {
        if (root === RootType.DefaultRoot) {
            // this will listen for app state changes and will check if we need to lock the app
            this.addAppStateListener();
        } else {
            this.removeAppStateListener();
        }
    };

    /**
     * Add appState listener
     */
    private addAppStateListener = () => {
        AppService.addListener('appStateChange', this.onAppStateChange);
    };

    /**
     * Remove appState listener
     */
    private removeAppStateListener = () => {
        AppService.removeListener('appStateChange', this.onAppStateChange);
    };

    /**
     * reinstate service
     */
    public reinstate = () => {
        // set locked to false
        this.setLockStatus(LockStatus.UNLOCKED);

        // remove appState listener
        this.removeAppStateListener();
    };

    /**
     * run services/functions which needs to run after auth done
     */
    runAfterSuccessAuth = () => {
        setTimeout(() => {
            while (this.postSuccess.length) {
                try {
                    this.postSuccess.shift()?.call(null);
                } catch (error) {
                    this.logger.error('runAfterSuccessAuth', error);
                }
            }
        }, 500);
    };

    /**
     * reset the entire app
     * WARNING: this action is irreversible, USED CAREFULLY
     */
    resetApp = async () => {
        // purge all account private keys
        await Vault.clearStorage();

        // wipe storage
        DataStorage.wipe();

        // exit the app
        ExitApp();
    };

    /**
     * set current lock status
     * @param {LockStatus} status current lock status
     */
    private setLockStatus = (status: LockStatus) => {
        this.lockStatus = status;

        // emit the event
        this.emit('lockStateChange', status);
    };

    /**
     * get current lock status
     */
    private getLockStatus = (): LockStatus => {
        return this.lockStatus;
    };

    /**
     * Calculate who long the input should be blocked base on number of wrong attempts
     * @param  {number} attemptNumber latest wrong attempt
     * @returns number wait time in seconds
     */
    private calculateWrongAttemptWaitTime = (attemptNumber: number): number => {
        if (attemptNumber < 6) return 0;

        switch (attemptNumber) {
            case 6:
                return 60;
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
     * @param ts
     */
    onSuccessAuthentication = async (ts?: number) => {
        if (!ts) {
            ts = await GetElapsedRealtime();
        }

        // change to unlocked
        this.setLockStatus(LockStatus.UNLOCKED);

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
     * @param ts
     */
    private onWrongPasscodeInput = async (coreSettings: any, ts?: number) => {
        if (!ts) {
            ts = await GetElapsedRealtime();
        }

        // increase failed attempt
        CoreRepository.saveSettings({
            passcodeFailedAttempts: coreSettings.passcodeFailedAttempts + 1,
            lastPasscodeFailedTimestamp: ts,
        });

        // check for purge on too many attempts
        if (coreSettings.purgeOnBruteForce) {
            // alert user next attempt will wipe the entire app
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
                await this.resetApp();
            }
        }
    };
    /**
     * Get the time app should not accept new pin code entry
     * @param  {any} coreSettings
     * @param  {number} realTime timestamp in seconds
     * @returns number block time in minutes
     */
    private getInputBlockTime = async (coreSettings: any, realTime: number): Promise<number> => {
        // check if attempts will exceed the threshold
        if (coreSettings.passcodeFailedAttempts > 5) {
            // calculate potential wait time
            const waitTime = this.calculateWrongAttemptWaitTime(coreSettings.passcodeFailedAttempts);

            // device is rebooted , we cannot calculate the wait time
            if (realTime < coreSettings.lastPasscodeFailedTimestamp) {
                // store the new latest real time
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
     * Authenticate with passcode
     * @param  {string} passcode clear passcode
     * @returns string hashed passcode
     */
    authenticatePasscode = (passcode: string): Promise<string> => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            // get core settings
            const coreSettings = CoreRepository.getSettings();
            // get device real time
            const realTime = await GetElapsedRealtime();
            // check if passcode input is blocked
            const blockTime = await this.getInputBlockTime(coreSettings, realTime);

            if (blockTime) {
                reject(new Error(Localize.t('global.tooManyAttempts', { after: blockTime })));
                return;
            }

            // calculate quick hash to compare passcode's
            const hashedPasscode = await CoreRepository.hashPasscode(passcode);

            // check if entered passcode is correct
            if (hashedPasscode === coreSettings.passcode) {
                // reset block timers and set status to unlocked
                await this.onSuccessAuthentication(realTime);
                // resolve
                resolve(hashedPasscode);
                return;
            }

            await this.onWrongPasscodeInput(coreSettings, realTime);

            reject(new Error(Localize.t('global.invalidPasscode')));
        });
    };

    /**
     * check if the app needs to be lock base on the latest lock time and user settings
     */
    checkLockScreen = async () => {
        /* eslint-disable-next-line */
        return new Promise<void>(async (resolve) => {
            // already locked no need to check
            if (this.getLockStatus() === LockStatus.LOCKED) {
                resolve();
                return;
            }

            const coreSettings = CoreRepository.getSettings();

            const realTime = await GetElapsedRealtime();

            if (
                coreSettings.lastUnlockedTimestamp === 0 ||
                realTime < (coreSettings.lastUnlockedTimestamp ?? 0) ||
                realTime - (coreSettings.lastUnlockedTimestamp ?? 0) > coreSettings.minutesAutoLock * 60
            ) {
                // show lock overlay
                Navigator.showOverlay<LockOverlayProps>(
                    AppScreens.Overlay.Lock,
                    {},
                    {
                        overlay: {
                            handleKeyboardEvents: false,
                        },
                    },
                );

                // change the lock status to locked
                this.setLockStatus(LockStatus.LOCKED);
            } else {
                // run services/functions need to run after success auth
                this.runAfterSuccessAuth();
            }

            resolve();
        });
    };

    /**
     * When biometric data has been changed, reset biometric method
     */
    onBiometricInvalidated = () => {
        CoreRepository.saveSettings({
            biometricMethod: BiometryType.None,
        });
    };

    /**
     * check if we can authenticate with biometrics
     */
    isBiometricAvailable = (): Promise<boolean> => {
        return new Promise((resolve) => {
            // check if biometry is active
            const coreSettings = CoreRepository.getSettings();
            if (coreSettings.biometricMethod === BiometryType.None) {
                resolve(false);
                return;
            }

            // check if we can authenticate with biometrics in the device level
            Biometric.isSensorAvailable()
                .then(() => {
                    resolve(true);
                })
                .catch(() => {
                    resolve(false);
                });
        });
    };

    /**
     * start biometric authentication
     */
    authenticateBiometrics = (reason: string): Promise<Boolean> => {
        return new Promise((resolve, reject) => {
            // check if we can authenticate with biometrics in the device level
            Biometric.authenticate(reason)
                .then(async () => {
                    // successfully authenticate
                    // reset block timers and set status to unlocked
                    await this.onSuccessAuthentication();
                    // return resolve
                    resolve(true);
                })
                .catch((error) => {
                    this.logger.warn('authenticateBiometrics', error);
                    // biometric's has been changed, we need to disable the biometric authentication
                    if (error.name === BiometricErrors.ERROR_BIOMETRIC_HAS_BEEN_CHANGED) {
                        this.onBiometricInvalidated();
                    }

                    // reject with error
                    reject(error);
                });
        });
    };

    /**
     * Listen for app state change to check for lock the app
     */
    onAppStateChange = async () => {
        // let's check the lock screen in any app state change
        await this.checkLockScreen();
    };
}

export default new AuthenticationService();
