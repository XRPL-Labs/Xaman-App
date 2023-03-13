// crypto
import { NativeModules } from 'react-native';

const { CryptoModule } = NativeModules;

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

const HMAC256 = (entry: string, key: string): Promise<string> => {
    return CryptoModule.hmac256(entry, key);
};

/* Crypt ==================================================================== */
const randomKey = (length: number): Promise<string> => {
    return CryptoModule.randomKey(length);
};

export { HMAC256, SHA512, SHA256, SHA1, randomKey };
