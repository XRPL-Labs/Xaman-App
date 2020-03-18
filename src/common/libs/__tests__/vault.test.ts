/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
/* eslint-disable operator-linebreak */

import * as Keychain from 'react-native-keychain';

import Vault from '../vault';

describe('Vault', () => {
    // clear entries
    const name = 'vaultname';
    const entry = 'mysecret';
    const key = 'mypassphrase';

    // encryped entries
    const iv = 'DB88708ECB905B483668B9568CB14EF8';
    const cipher = 'aEd2uxceOSc0bofUN3IONg==';

    describe('Create', () => {
        it('should create a vault', async () => {
            await Vault.create(name, entry, key).then(r => expect(r).toBe(true));
        });

        it('should call setInternetCredentials method on keychain', async () => {
            await Vault.create(name, entry, key).then(() => {
                expect(Keychain.setInternetCredentials).toHaveBeenCalled();
            });
        });
    });

    describe('Save', () => {
        it('should save a entry into the keychain', async () => {
            await Vault.save(iv, { iv, cipher }).then(r => expect(r).toBe(true));
        });

        it('should call setInternetCredentials method on keychain', async () => {
            await Vault.save(name, { iv, cipher }).then(() => {
                expect(Keychain.setInternetCredentials).toHaveBeenCalledWith(name, iv, cipher);
            });
        });
    });

    describe('Retrieve', () => {
        it('should get a vault from keychain', async () => {
            await Vault.retrieve(name).then(data => {
                expect(data).toEqual({ iv, cipher });
            });
        });

        it('should return empty vault entry on no exist vault', async () => {
            await Vault.retrieve('nonexist').then(data => {
                expect(data).toEqual({ iv: '', cipher: '' });
            });
        });

        it('should call getInternetCredentials method on keychain', async () => {
            await Vault.retrieve(name).then(() => {
                expect(Keychain.getInternetCredentials).toHaveBeenCalledWith(name);
            });
        });
    });

    describe('reKey', () => {
        it('should Rekey vault entry', async () => {
            await Vault.reKey(name, key, 'newKey').then(data => {
                expect(data).toEqual(true);
            });
        });

        it('should return false on no exist vault', async () => {
            await Vault.reKey('nonexist', key, 'newKey').then(data => {
                expect(data).toEqual(false);
            });
        });

        it('should return false on invalid key', async () => {
            await Vault.reKey(name, 'invalidkey', 'newKey').then(data => {
                expect(data).toEqual(false);
            });
        });
    });

    describe('Open', () => {
        it('should open/decrypt a vault', async () => {
            await Vault.open(name, key).then(data => {
                expect(data).toBe(entry);
            });
        });

        it('should return false on invalid key', async () => {
            await Vault.open(name, 'invalidkey').then(data => {
                expect(data).toEqual('');
            });
        });

        it('should return empty non exist vault', async () => {
            await Vault.open('nonexist', key).then(data => {
                expect(data).toEqual('');
            });
        });
    });

    describe('Purge', () => {
        it('should call resetInternetCredentials method on keychain', async () => {
            await Vault.purge(name).then(() => {
                expect(Keychain.resetInternetCredentials).toHaveBeenCalledWith(name);
            });
        });
    });
});
