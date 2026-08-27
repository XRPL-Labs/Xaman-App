/* eslint-disable max-len */
/* eslint-disable operator-linebreak */

import { NativeModules } from 'react-native';
import LoggerService from '@services/LoggerService';
import Vault from '../vault';

const { VaultManagerModule, UniqueIdProviderModule } = NativeModules;

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

        it('should warn in session log when stored device id fallback succeeded', async () => {
            VaultManagerModule.openVault.mockResolvedValueOnce({
                clearText: 'clearText',
                fallbackUsed: true,
                storedDifferedFromLive: true,
            });

            await expect(Vault.open(name, key)).resolves.toBe('clearText');

            const warn = LoggerService.getLogs().find(
                (entry) =>
                    entry.level === 'warn' &&
                    entry.message.includes('LIVE DEVICE ID DID NOT DECRYPT'),
            );
            expect(warn).toBeDefined();
        });

        it('should resolve undefined and keep native reason out of the return value', async () => {
            VaultManagerModule.openVault.mockRejectedValueOnce({
                code: 'DEVICE_ID_CHANGED',
                message:
                    'CipherV2AesGcm decryption failed after 2 device id(s); last stored device id does not match current device id (possible data migration to another device); underlying=WRONG_PASSPHRASE',
            });

            await expect(Vault.open(name, key)).resolves.toBeUndefined();

            const sessionLog = LoggerService.getLogs().find(
                (entry) =>
                    entry.level === 'error' &&
                    entry.message.includes('ORIGINALLY CONFIGURED ON ANOTHER PHONE'),
            );
            expect(sessionLog).toBeDefined();
        });
    });

    describe('Inspect health', () => {
        it('should log when account vault wrap is unreadable after Realm opened', async () => {
            VaultManagerModule.inspectVaultHealth.mockResolvedValueOnce({
                lastKnownPresent: false,
                livePresent: true,
                lastKnownMatchesLive: false,
                uniqueIdKeychainReadable: false,
                realmKeyReadable: true,
                vaultsPresent: 1,
            });

            await Vault.inspectHealth();

            expect(UniqueIdProviderModule.backfillLastKnownFromReadableUniqueId).toHaveBeenCalled();

            const sessionLog = LoggerService.getLogs().find(
                (entry) =>
                    entry.level === 'error' &&
                    entry.message.includes('DEVICE-UNIQUE-ID KEYCHAIN UNREADABLE AND NO LAST STORED DEVICE ID'),
            );
            expect(sessionLog).toBeDefined();
        });
    });

    describe('Storage encryption key', () => {
        it('should not log another-phone passphrase copy on Keystore wrap fail', async () => {
            LoggerService.clearLogs();
            VaultManagerModule.getStorageEncryptionKey.mockRejectedValueOnce({
                code: 'KEYSTORE_UNRECOVERABLE',
                message: 'Keystore key unrecoverable for alias: xumm-realm-key',
            });

            await expect(Vault.getStorageEncryptionKey()).rejects.toBeDefined();

            const anotherPhone = LoggerService.getLogs().find(
                (entry) =>
                    entry.level === 'error' &&
                    entry.message.includes('ORIGINALLY CONFIGURED ON ANOTHER PHONE'),
            );
            expect(anotherPhone).toBeUndefined();

            const wrapLog = LoggerService.getLogs().find(
                (entry) =>
                    entry.level === 'error' &&
                    entry.message.includes('REALM KEYSTORE WRAP IS UNREADABLE'),
            );
            expect(wrapLog).toBeDefined();
        });
    });

    describe('Purge', () => {
        it('should call purgeVault method on VaultModule', async () => {
            await Vault.purge(name).then(() => {
                expect(VaultManagerModule.purgeVault).toHaveBeenCalled();
            });
        });
    });

    describe('Wipe local datastore', () => {
        it('should call wipeLocalDatastore on VaultModule', async () => {
            await Vault.wipeLocalDatastore();
            expect(VaultManagerModule.wipeLocalDatastore).toHaveBeenCalled();
        });
    });
});
