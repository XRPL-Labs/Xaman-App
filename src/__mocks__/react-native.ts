/* eslint-disable */

const ReactNative = require('react-native');
const crypto = require('crypto');

ReactNative.NativeModules.CryptoModule = {
    randomKeySync: jest.fn((len: number) => crypto.randomBytes(len).toString('hex').toUpperCase()),
    randomKey: jest.fn((len: number) => Promise.resolve(crypto.randomBytes(len).toString('hex').toUpperCase())),
    sha512: jest.fn((value) => Promise.resolve(crypto.createHash('sha512').update(value).digest('hex'))),
    sha256: jest.fn((value) => Promise.resolve(crypto.createHash('sha256').update(value).digest('hex'))),
    sha1: jest.fn((value) => Promise.resolve(crypto.createHash('sha1').update(value).digest('hex'))),
    hmac256: jest.fn((value, key) =>
        Promise.resolve(crypto.createHmac('sha256', Buffer.from(key, 'hex')).update(value).digest('hex')),
    ),
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
    getElapsedRealtime: jest.fn(() => Promise.resolve(123)),
    exitApp: jest.fn(() => true),
};

ReactNative.NativeModules.LocalNotificationModule = {
    setBadge: jest.fn((badge: number) => Promise.resolve()),
    getBadge: jest.fn(() => Promise.resolve(1)),
    complete: jest.fn((messageId: string, show: boolean) => true),
};

ReactNative.NativeModules.AppUpdateModule = {
    checkUpdate: jest.fn(() => Promise.resolve(123)),
    startUpdate: jest.fn(() => Promise.resolve()),
};

ReactNative.NativeModules.SharedPreferencesModule = {
    get: jest.fn((key) => Promise.resolve('value')),
    set: jest.fn((key, value) => Promise.resolve(true)),
    del: jest.fn((key) => Promise.resolve(true)),
};

ReactNative.NativeModules.Toast = {
    showWithGravity: jest.fn((message: string, duration: any, gravity: number) => true),
};

ReactNative.NativeModules.DeviceUtilsModule = {
    layoutInsets: { top: 0, bottom: 0 },
    brand: 'Apple',
    model: 'iPhone13,4',
    osVersion: '15,5',
    getElapsedRealtime: jest.fn(() => Promise.resolve(0)),
    isJailBroken: jest.fn(() => Promise.resolve(false)),
    isRooted: jest.fn(() => Promise.resolve(false)),
    getTimeZone: jest.fn(() => Promise.resolve('Europe/Amsterdam')),
    getLocalSetting: jest.fn(() =>
        Promise.resolve({ delimiter: ',', languageCode: 'en', locale: 'en_US', separator: '.' }),
    ),
};

ReactNative.NativeModules.AppUtilsModule = {
    appVersion: '0.0.1',
    buildNumber: '1',
    isDebug: false,
    isFlagSecure: jest.fn(() => Promise.resolve(false)),
    setFlagSecure: jest.fn((value) => {}),
    restartBundle: jest.fn(() => {}),
    exitApp: jest.fn(() => {}),
    timeoutEvent: jest.fn((key, delay) => {}),
};

ReactNative.NativeModules.UniqueIdProviderModule = {
    getDeviceUniqueId: jest.fn(() => 'e988b7a9-f685-4674-87bc-0ad52a52faa5'),
};

ReactNative.NativeModules.HapticFeedbackModule = {
    trigger: jest.fn((type) => {}),
};

module.exports = ReactNative;
