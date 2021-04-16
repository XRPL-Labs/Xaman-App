import DeviceInfo from 'react-native-device-info';

import { Platform, PixelRatio, NativeModules } from 'react-native';

const { UtilsModule } = NativeModules;

/**
 * IOS: Check if device is a IPhone 10
 * @returns boolean
 */
const IsIOS10 = (): boolean => {
    if (Platform.OS !== 'ios') return false;

    // @ts-ignore
    const majorVersionIOS = parseInt(Platform.Version, 10);

    if (majorVersionIOS <= 10) {
        return true;
    }

    return false;
};

/**
 * Check if device have notch
 * @returns boolean
 */

const hasNotch = (): boolean => {
    return DeviceInfo.hasNotch();
};

/**
 * IOS: Get bottom tab scale base on pixel ratio
 * @returns number
 */
const GetBottomTabScale = (factor?: number): number => {
    if (Platform.OS !== 'ios') return 0;
    const ratio = PixelRatio.get();

    let scale;
    switch (ratio) {
        case 2:
            scale = 4.5;
            break;
        case 3:
            scale = 6;
            break;
        default:
            scale = ratio * 2;
    }

    if (factor) {
        return scale * factor;
    }

    return scale;
};

/**
 * Android: Check if flagSecure is set on current activity
 * @returns Promise<boolean>
 */
const IsFlagSecure = (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
        return Promise.resolve(false);
    }
    return UtilsModule.isFlagSecure();
};

/**
 * Android: turn on/off flagSecure flag on current activity
 */
const FlagSecure = (enable: boolean): void => {
    if (Platform.OS !== 'android') {
        return;
    }

    UtilsModule.flagSecure(enable);
};

/**
 * IOS: check if device is jail broken
 * @returns Promise<boolean>
 */
const IsDeviceJailBroken = (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
        return Promise.resolve(false);
    }
    return UtilsModule.isJailBroken();
};

/**
 * Android: check if device is rooted
 * @returns Promise<boolean>
 */
const IsDeviceRooted = (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
        return Promise.resolve(false);
    }
    return UtilsModule.isRooted();
};

/**
 * Get device default timezone
 * @returns Promise<string>
 */
const GetDeviceTimeZone = (): Promise<string> => {
    return UtilsModule.getTimeZone();
};

/**
 * Get device local settings
 * @returns Promise<object>
 */
const GetDeviceLocaleSettings = (): Promise<any> => {
    return new Promise(resolve => {
        UtilsModule.getLocalSetting()
            .then((settings: any) => {
                resolve(settings);
            })
            .catch(() => {
                resolve({ delimiter: ',', languageCode: 'en', locale: 'en_US', separator: '.' });
            });
    });
};

/**
 * Get the latest real time base on device CPU ticks
 * @returns Promise<number>
 */
const GetElapsedRealtime = (): Promise<number> => {
    return new Promise(resolve => {
        UtilsModule.getElapsedRealtime().then((ts: string) => {
            return resolve(Number(ts));
        });
    });
};

/**
 * Get app readable version
 * @returns string
 */
const GetAppReadableVersion = (): string => {
    return DeviceInfo.getReadableVersion();
};

/**
 * Gets the device ID.
 * @returns string
 */
const GetDeviceId = (): string => {
    return DeviceInfo.getDeviceId();
};

/**
 * Gets the device OS version.
 * @returns string
 */
const GetSystemVersion = (): string => {
    return DeviceInfo.getSystemVersion();
};

/**
 * Get device unique id
 * @returns string
 */
const GetDeviceUniqueId = (): string => {
    return DeviceInfo.getUniqueId();
};

/**
 * Get app version code
 * @returns string
 */
const GetAppVersionCode = (): string => {
    return DeviceInfo.getVersion();
};

/**
 * Restart react native bundle
 */
const RestartBundle = (): void => {
    UtilsModule.restartBundle();
};

/**
 * hard close the app process
 */
const ExitApp = (): void => {
    UtilsModule.exitApp();
};

/* Export ==================================================================== */
export {
    hasNotch,
    IsIOS10,
    GetBottomTabScale,
    IsFlagSecure,
    FlagSecure,
    IsDeviceJailBroken,
    IsDeviceRooted,
    GetDeviceTimeZone,
    GetDeviceLocaleSettings,
    GetElapsedRealtime,
    GetAppReadableVersion,
    GetDeviceId,
    GetSystemVersion,
    GetDeviceUniqueId,
    GetAppVersionCode,
    RestartBundle,
    ExitApp,
};
