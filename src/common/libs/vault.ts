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
        return new Promise((resolve, reject) => {
            VaultManagerModule.vaultExist(name)
                .then((result: boolean) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    logger.error('Vault vaultExist error', error);
                    reject(error);
                });
        });
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
                .catch((error: any) => {
                    logger.error('Vault getStorageEncryptionKey error', error);
                    reject(error);
                });
        });
    },

    /**
     *  check if vault needs migration
     */
    isMigrationRequired: (name: string): Promise<any> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.isMigrationRequired(name)
                .then((result: any) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    logger.error('Vault isMigrationRequired error', error);
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
                .then((result: boolean) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    logger.error('Vault reKey error');
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
                .then((result: boolean) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    logger.error('Vault batch reKey error');
                    reject(error);
                });
        });
    },

    // Delete Vault & PrivateKey from keychain
    purge: (name: string): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            VaultManagerModule.purgeVault(name)
                .then((result: boolean) => {
                    resolve(result);
                })
                .catch((error: any) => {
                    logger.error('Vault purge error', error);
                    reject(error);
                });
        });
    },
};

export default Vault;
