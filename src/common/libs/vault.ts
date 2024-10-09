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
     * get vault cipher latest version
     */
    getLatestCipherVersion: (): number => {
        return VaultManagerModule.latestCipherVersion;
    },

    /**
     * Generate/Store Vault
     */
    create: async (name: string, entry: string, key: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.createVault(name, entry, key)
                .then(resolve)
                .catch((error) => {
                    logger.error(`create [${name}]`, error);
                    reject(error);
                });
        });
    },

    /**
     *  Open Vault using provided key
     */
    open: async (name: string, key: string): Promise<string | undefined> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.openVault(name, key)
                .then((clearText: string) => {
                    // this should never happen, just double-checking
                    if (!clearText) {
                        reject(new Error('Vault open, received empty clear text!'));
                        return;
                    }
                    resolve(clearText);
                })
                .catch((error) => {
                    logger.error(`open [${name}]`, error);
                    resolve(undefined);
                });
        });
    },

    /**
     *  Check key exist in vault
     */
    exist: async (name: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.vaultExist(name)
                .then(resolve)
                .catch((error) => {
                    logger.error(`exist [${name}]`, error);
                    reject(error);
                });
        });
    },

    /**
     * Check if storage encryption key exist in the keychain
     */
    isStorageEncryptionKeyExist: (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.isStorageEncryptionKeyExist()
                .then(resolve)
                .catch((error) => {
                    logger.error('isStorageEncryptionKeyExist', error);
                    reject(error);
                });
        });
    },

    /**
     *  get storage encryption key from vault
     *  NOTE: this method will generate/store new encryption key if not exist
     */
    getStorageEncryptionKey: (): Promise<Buffer> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.getStorageEncryptionKey()
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
                .catch((error) => {
                    logger.error('getStorageEncryptionKey', error);
                    reject(error);
                });
        });
    },

    /**
     *  check if vault needs migration
     */
    isMigrationRequired: (
        name: string,
    ): Promise<{
        vault: string;
        current_cipher_version: number;
        latest_cipher_version: number;
        migration_required: boolean;
    }> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.isMigrationRequired(name)
                .then(resolve)
                .catch((error) => {
                    logger.error(`isMigrationRequired [${name}]`, error);
                    reject(error);
                });
        });
    },

    /**
     *  reKey the vault content
     */
    reKey: async (name: string, oldKey: string, newKey: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.reKeyVault(name, oldKey, newKey)
                .then(resolve)
                .catch((error) => {
                    logger.error(`reKey [${name}]`, error);
                    reject(error);
                });
        });
    },

    /**
     *  reKey the vault content
     */
    reKeyBatch: async (names: string[], oldKey: string, newKey: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.reKeyBatchVaults(names, oldKey, newKey)
                .then(resolve)
                .catch((error) => {
                    logger.error('reKeyBatch', error);
                    reject(error);
                });
        });
    },

    // Delete Vault & PrivateKey from keychain
    purge: (name: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.purgeVault(name)
                .then(resolve)
                .catch((error) => {
                    logger.error(`purge [${name}]`, error);
                    reject(error);
                });
        });
    },

    // Purge All vaults in the keychain
    clearStorage: (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.clearStorage()
                .then(resolve)
                .catch((error) => {
                    logger.error('clearStorage', error);
                    reject(error);
                });
        });
    },
};

export default Vault;
