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
            username: 'DB88708ECB905B483668B9568CB14EF8', // iv
            password: 'aEd2uxceOSc0bofUN3IONg==', // encrypted
        },
        nonexist: '',
    };

    // @ts-ignore
    return Promise.resolve<any>(result[alias]);
});

const resetInternetCredentials = jest.fn(() => Promise.resolve());

export { setInternetCredentials, getInternetCredentials, resetInternetCredentials };
