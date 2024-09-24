/* eslint-disable max-len */
/* eslint-disable operator-linebreak */

import { NativeModules } from 'react-native';
import Vault from '../vault';

const { VaultManagerModule } = NativeModules;

describe('Vault', () => {
    const name = 'vaultName';
    const entry = 'mySecret';
    const key = 'myPassphrase';

    describe('Create', () => {
        it('should call createVault method on VaultModule', async () => {
            await Vault.create(name, entry, key).then(() => {
                expect(VaultManagerModule.createVault).toHaveBeenCalled();
            });
        });
    });

    describe('Open', () => {
        it('should call openVault method on VaultModule', async () => {
            await Vault.open(name, key).then(() => {
                expect(VaultManagerModule.openVault).toHaveBeenCalled();
            });
        });
    });

    describe('Purge', () => {
        it('should call purgeVault method on VaultModule', async () => {
            await Vault.purge(name).then(() => {
                expect(VaultManagerModule.purgeVault).toHaveBeenCalled();
            });
        });
    });
});
