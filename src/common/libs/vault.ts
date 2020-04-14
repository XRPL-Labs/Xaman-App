/**
 * Vault
 *
 * Store Encrypt\Decrypt sensitive data in native keychain
 *
 */

import * as Keychain from 'react-native-keychain';

import { AES, randomKey } from '@common/libs/crypto';
import { HexEncoding } from '@common/libs/utils';

import LoggerService from '@services/LoggerService';

/* Types ==================================================================== */
export interface VaultEntry {
    iv: string;
    cipher: string;
}

/* Logger ==================================================================== */
const logger = LoggerService.createLogger('Vault');

const options = {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/* Lib ==================================================================== */
const Vault = {
    /**
     * Generate Secret Vault for storing the seed/secrets
     */
    create: async (name: string, entry: string, key: string): Promise<boolean> => {
        const { iv, cipher } = await AES.encrypt(entry, key);
        return Vault.save(name, { iv, cipher });
    },

    /**
     *  Store Secret Box in keychain under hashed key
     */
    save: async (name: string, entry: VaultEntry): Promise<boolean> => {
        return Keychain.setInternetCredentials(name, entry.iv, entry.cipher, options)
            .then((): boolean => true)
            .catch((): boolean => false);
    },

    /**
     *  Retrieve Vault & Nonce from keychain
     */
    retrieve: async (name: string): Promise<VaultEntry> => {
        return Keychain.getInternetCredentials(name)
            .then(
                (data): VaultEntry => {
                    if (!data) {
                        return { iv: '', cipher: '' };
                    }
                    return {
                        iv: data.username,
                        cipher: data.password,
                    };
                },
            )
            .catch(
                (error: string): VaultEntry => {
                    logger.error('Keychain could not be accessed! Maybe no value set?', error);
                    return { iv: '', cipher: '' };
                },
            );
    },

    /**
     *  Use key to open specific Vault
     */
    open: async (name: string, key: string): Promise<string> => {
        try {
            const { iv, cipher } = await Vault.retrieve(name);

            if (iv && cipher) {
                const entry = await AES.decrypt(cipher, key, iv);
                if (!entry) {
                    return '';
                }
                return entry;
            }
            return '';
        } catch {
            return '';
        }
    },

    /**
     *  get storage encryption key from vault
     */
    getStorageEncryptionKey: async (keyName: string): Promise<Buffer> => {
        return Keychain.getInternetCredentials(keyName).then((data: any) => {
            if (!data) {
                return randomKey(64).then((key: string) => {
                    return Keychain.setInternetCredentials(keyName, 'empty', key).then(() => {
                        return HexEncoding.toBinary(key);
                    });
                });
            }
            return HexEncoding.toBinary(data.password);
        });
    },

    /**
     *  reKey the vault content
     */
    reKey: async (name: string, oldKey: string, newKey: string): Promise<boolean> => {
        try {
            const entry = await Vault.open(name, oldKey);

            if (!entry) {
                return false;
            }

            return Vault.create(name, entry, newKey);
        } catch (e) {
            logger.error(`Unable reKey account ${name}`, e);
            return false;
        }
    },

    // Delete Vault & Privatekey from keychain
    purge: async (name: string): Promise<void> => {
        return Keychain.resetInternetCredentials(name);
    },
};

export default Vault;
