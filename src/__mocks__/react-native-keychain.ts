/* eslint-disable  spellcheck/spell-checker */

import { AppConfig } from '../common/constants';

const setInternetCredentials = jest.fn(() => Promise.resolve());

const getInternetCredentials = jest.fn((alias: any) => {
    const result = {
        [AppConfig.storage.keyName]: {
            username: '9D00C02555A67596F8270610524E6ACCC4D4F285AA858EB39F75DFED52A4555A', // iv
            password: '',
        },
        vaultname: {
            username: '37d4c2995a8418a508986c79abbdc02e', // iv
            password: '7AGMM0LHPyP+tXisMrYtKw==', // cipher
        },
        nonexist: '',
    };

    // @ts-ignore
    return Promise.resolve<any>(result[alias]);
});

const resetInternetCredentials = jest.fn(() => Promise.resolve());

const ACCESSIBLE = {
    WHEN_UNLOCKED: 'AccessibleWhenUnlocked',
    AFTER_FIRST_UNLOCK: 'AccessibleAfterFirstUnlock',
    ALWAYS: 'AccessibleAlways',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'AccessibleWhenPasscodeSetThisDeviceOnly',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'AccessibleWhenUnlockedThisDeviceOnly',
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
    ALWAYS_THIS_DEVICE_ONLY: 'AccessibleAlwaysThisDeviceOnly',
};

export { setInternetCredentials, getInternetCredentials, resetInternetCredentials, ACCESSIBLE };
