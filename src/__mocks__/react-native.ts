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
};

ReactNative.NativeModules.UtilsModule = {
    flagSecure: jest.fn((enable: boolean) => true),
    isRooted: jest.fn(() => false),
    isJailBroken: jest.fn(() => false),
    getTimeZone: jest.fn(() => 'Europe/Amsterdam'),
    hapticFeedback: jest.fn((type: any) => true),
    restartBundle: jest.fn(() => true),
    timeoutEvent: jest.fn((event: string, timeout: number) => true),
    getElapsedRealtime: jest.fn(() => Promise.resolve('1337')),
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

ReactNative.NativeModules.VaultManagerModule = {
    latestCipherVersion: 2,
    getStorageEncryptionKey: jest.fn(() =>
        Promise.resolve(
            '1567F58A794600717029077C34A8FAAB9B16B9FFAB174248DD296DA82084EE7921E51DC5757CA655271AF4928263FEC4A36D2139AD02F9CB1BC70F8FD7D38796',
        ),
    ),
    isStorageEncryptionKeyExist: jest.fn(() => Promise.resolve(true)),
    createVault: jest.fn((vaultName: string, entry: string, key: string) => Promise.resolve(true)),
    openVault: jest.fn((vaultName: string, key: string) => Promise.resolve('clearText')),
    vaultExist: jest.fn((vaultName: string) => Promise.resolve(true)),
    purgeVault: jest.fn((vaultName: string) => Promise.resolve(true)),
    reKeyVault: jest.fn((vaultName: string, oldKey: string, newKey: string) => Promise.resolve(true)),
    reKeyBatchVaults: jest.fn((vaultNames: string[], oldKey: string, newKey: string) => Promise.resolve(true)),
    clearStorage: jest.fn(() => Promise.resolve(true)),
    isMigrationRequired: jest.fn((vaultName: string) =>
        Promise.resolve({
            vault: vaultName,
            current_cipher_version: 2,
            latest_cipher_version: 2,
            migration_required: false,
        }),
    ),
};

ReactNative.NativeModules.InAppPurchaseModule = {
    isUserPurchasing: jest.fn((type) => false),
};

ReactNative.Animated.timing = () => ({
    start: (cb?: () => void) => (cb ? cb() : undefined),
});

module.exports = ReactNative;
