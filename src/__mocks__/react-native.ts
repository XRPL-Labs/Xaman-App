/* eslint-disable */

const ReactNative = require('react-native');
const crypto = require('crypto');

ReactNative.NativeModules.CryptoModule = {
    randomKeySync: jest.fn((len: number) => crypto.randomBytes(len).toString('hex').toUpperCase()),
    randomKey: jest.fn((len: number) => Promise.resolve(crypto.randomBytes(len).toString('hex').toUpperCase())),
    sha512: jest.fn((value) => Promise.resolve(crypto.createHash('sha512').update(value).digest('hex'))),
    sha256: jest.fn((value) => Promise.resolve(crypto.createHash('sha256').update(value).digest('hex'))),
    sha1: jest.fn((value) => Promise.resolve(crypto.createHash('sha1').update(value).digest('hex'))),
    hmac256: jest.fn((value, key) => Promise.resolve(crypto.createHmac('sha256', key).update(value).digest('hex'))),
    encrypt: jest.fn((entry, key) => {
        const ivHex = crypto.randomBytes(16).toString('hex').toUpperCase();
        const keyEnc = crypto.createHash('sha256').update(key).digest();

        const iv = Buffer.from(ivHex, 'hex');
        const cipher = crypto.createCipheriv('aes-256-cbc', keyEnc, iv);
        entry = Buffer.from(entry);
        let crypted = cipher.update(entry, 'utf-8', 'base64');
        crypted += cipher.final('base64');
        return Promise.resolve({ cipher: crypted, iv: ivHex });
    }),
    decrypt: jest.fn((entry, key, iv) => {
        const keyEnc = crypto.createHash('sha256').update(key).digest();
        iv = Buffer.from(iv, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyEnc, iv);
        let decrypted = decipher.update(entry, 'base64');
        decrypted += decipher.final();
        return Promise.resolve(decrypted);
    }),
};

ReactNative.NativeModules.UtilsModule = {
    flagSecure: jest.fn((enable: boolean) => true),
    isRooted: jest.fn(() => false),
    isJailBroken: jest.fn(() => false),
    getTimeZone: jest.fn(() => 'Europe/Amsterdam'),
    hapticFeedback: jest.fn((type: any) => true),
    restartBundle: jest.fn(() => true),
    timeoutEvent: jest.fn((event: string, timeout: number) => true),
    getElapsedRealtime: jest.fn(() => 123),
    exitApp: jest.fn(() => true),
};

ReactNative.NativeModules.LocalNotificationModule = {
    setBadge: jest.fn((badge: number) => Promise.resolve()),
    getBadge: jest.fn(() => Promise.resolve(1)),
    complete: jest.fn((messageId: string, show: boolean) => true),
};

module.exports = ReactNative;
