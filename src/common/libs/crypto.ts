// crypto
import { NativeModules } from 'react-native';

const { CryptoModule } = NativeModules;

/* Types ==================================================================== */
export type AESEntry = {
    cipher: string;
    iv: string;
};

/* Hash ==================================================================== */
const SHA512 = (entry: string): Promise<string> => {
    return CryptoModule.sha512(entry);
};

const SHA256 = (entry: string): Promise<string> => {
    return CryptoModule.sha256(entry);
};

const SHA1 = (entry: string): Promise<string> => {
    return CryptoModule.sha1(entry);
};

const PBKDF2 = (entry: string, salt: string, cost = 100000, length = 128): Promise<string> => {
    return CryptoModule.pbkdf2(entry, salt, cost, length);
};

const HMAC256 = (entry: string, key: string): Promise<string> => {
    return CryptoModule.hmac256(entry, key);
};

/* Crypt ==================================================================== */
const AES = {
    encrypt: (entry: string, key: string): Promise<AESEntry> => {
        return CryptoModule.encrypt(entry, key).then(({ cipher, iv }: { cipher: string; iv: string }) => ({
            cipher,
            iv,
        }));
    },

    decrypt: (cipher: string, key: string, iv: string): Promise<string> => {
        try {
            return CryptoModule.decrypt(cipher, key, iv);
        } catch {
            return Promise.resolve('');
        }
    },
};

const randomKey = (length: number): Promise<string> => {
    return CryptoModule.randomKey(length);
};

export { PBKDF2, HMAC256, SHA512, SHA256, SHA1, AES, randomKey };
