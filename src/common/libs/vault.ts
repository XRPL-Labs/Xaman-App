/**
 * Vault
 *
 * Store Encrypt\Decrypt sensitive data in native keychain
 *
 */

import { NativeModules } from 'react-native';
import { HexEncoding } from '@common/utils/string';

import LoggerService from '@services/LoggerService';

/* Module ==================================================================== */
const { VaultManagerModule } = NativeModules;

/* Logger ==================================================================== */
const logger = LoggerService.createLogger('Vault');

/* Lib ==================================================================== */
const Vault = {
    /**
     * Generate/Store Vault
     */
    create: async (name: string, entry: string, key: string): Promise<boolean> => {
        return VaultManagerModule.createVault(name, entry, key);
    },

    /**
     *  Open Vault using provided key
     */
    open: async (name: string, key: string): Promise<string> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.openVault(name, key)
                .then((clearText: string) => {
                    // this should never happen
                    if (!clearText) {
                        reject(new Error('Vault open clear text is not defined!'));
                        return;
                    }
                    resolve(clearText);
                })
                .catch((error: any) => {
                    logger.error('Vault open error', error);
                    resolve(undefined);
                });
        });
    },

    /**
     *  Check key exist in vault
     */
    exist: async (name: string): Promise<boolean> => {
        return VaultManagerModule.vaultExist(name);
    },

    /**
     *  get storage encryption key from vault
     *  NOTE: this method will generate/store new encryption key if not exist
     */
    getStorageEncryptionKey: (keyName: string): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.getStorageEncryptionKey(keyName)
                .then((key: any) => {
                    if (!key || key.length !== 128) {
                        reject(new Error('Encryption key size is wrong or not present!'));
                        return;
                    }
                    // encryption key presents as hex string, convert to buffer
                    const keyBytes = HexEncoding.toBinary(key);
                    // check if we got the right bytes
                    if (!keyBytes || keyBytes.length !== 64) {
                        reject(new Error('Encryption key size is wrong!'));
                        return;
                    }

                    resolve(keyBytes);
                })
                .catch((e: any) => {
                    reject(e);
                });
        });
    },

    /**
     *  check if vault needs migration
     */
    isMigrationRequired: (keyName: string): Promise<Number> => {
        return VaultManagerModule.isMigrationRequired(keyName);
    },

    /**
     *  reKey the vault content
     *  TODO: this need to change to a more reliable way
     */
    reKey: async (name: string, oldKey: string, newKey: string): Promise<boolean> => {
        try {
            // open the vault and fetch clear text
            const clearText = await Vault.open(name, oldKey);

            if (!clearText) {
                return false;
            }

            // remove the old vault
            const purgeResult = await Vault.purge(name);

            if (!purgeResult) {
                return false;
            }

            // create the new vault
            return await Vault.create(name, clearText, newKey);
        } catch (error: any) {
            logger.error('Vault reKey error', error);
            return false;
        }
    },

    // Delete Vault & PrivateKey from keychain
    purge: (name: string): Promise<boolean> => {
        return new Promise((resolve) => {
            VaultManagerModule.purgeVault(name)
                .then((result: boolean) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    logger.error('Vault purge error', error);
                    resolve(false);
                });
        });
    },
};

export default Vault;
