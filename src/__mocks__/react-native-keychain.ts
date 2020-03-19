/* eslint-disable  spellcheck/spell-checker */
/* eslint-disable  max-len */

import { AppConfig } from '../common/constants';

const setInternetCredentials = jest.fn(() => Promise.resolve());

const getInternetCredentials = jest.fn((alias: any) => {
    const result = {
        [AppConfig.storage.keyName]: {
            username: '',
            password:
                '1567F58A794600717029077C34A8FAAB9B16B9FFAB174248DD296DA82084EE7921E51DC5757CA655271AF4928263FEC4A36D2139AD02F9CB1BC70F8FD7D38796',
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
