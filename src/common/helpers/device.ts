import { Platform, PixelRatio, NativeModules } from 'react-native';

const { DeviceUtilsModule, UniqueIdProviderModule } = NativeModules;

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
 * Get window layout insets
 * @returns {top: 0, bottom: 0}
 */
const GetLayoutInsets = (): { top: number; bottom: number } => {
    return DeviceUtilsModule.layoutInsets;
};

/**
 * Check if device have notch
 * @returns boolean
 */
const HasNotch = (): boolean => {
    // TODO: check for android devices
    if (Platform.OS === 'ios') {
        const { top, bottom } = GetLayoutInsets();
        return top > 0 || bottom > 0;
    }
    return false;
};

/**
 * IOS: check if device is jail broken
 * @returns Promise<boolean>
 */
const IsDeviceJailBroken = (): Promise<boolean> => {
    if (Platform.OS !== 'ios') {
        return Promise.resolve(false);
    }
    return DeviceUtilsModule.isJailBroken();
};

/**
 * Android: check if device is rooted
 * @returns Promise<boolean>
 */
const IsDeviceRooted = (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
        return Promise.resolve(false);
    }
    return DeviceUtilsModule.isRooted();
};

/**
 * Get device default timezone
 * @returns Promise<string>
 */
const GetDeviceTimeZone = (): Promise<string> => {
    return DeviceUtilsModule.getTimeZone();
};

/**
 * Get device local settings
 * @returns Promise<object>
 */
const GetDeviceLocaleSettings = (): Promise<any> => {
    return new Promise((resolve) => {
        DeviceUtilsModule.getLocalSetting()
            .then((settings: any) => {
                resolve(settings);
            })
            .catch(() => {
                // if failed to fetch the local settings default to EN
                resolve({ delimiter: ',', languageCode: 'en', locale: 'en_US', separator: '.' });
            });
    });
};

/**
 * Gets the device brand name
 * @returns string
 */
const GetDeviceBrand = (): string => {
    return `${DeviceUtilsModule.brand} ${DeviceUtilsModule.model}`;
};

/**
 * Gets the device OS version.
 * @returns string
 */
const GetDeviceOSVersion = (): string => {
    return `${DeviceUtilsModule.osVersion}`;
};

/**
 * Get the latest real time base on device CPU ticks
 * @returns Promise<number>
 */
const GetElapsedRealtime = (): Promise<number> => {
    return new Promise((resolve) => {
        DeviceUtilsModule.getElapsedRealtime()
            .then((ts: string) => {
                return resolve(Number(ts));
            })
            .catch(() => {
                throw new Error('Unable to fetch elapsed real time!');
            });
    });
};

/**
 * Get device unique id
 * @returns string
 */
const GetDeviceUniqueId = (): string => {
    return UniqueIdProviderModule.getDeviceUniqueId();
};

/* Export ==================================================================== */
export {
    HasNotch,
    GetBottomTabScale,
    GetLayoutInsets,
    IsDeviceJailBroken,
    IsDeviceRooted,
    GetDeviceTimeZone,
    GetDeviceLocaleSettings,
    GetElapsedRealtime,
    GetDeviceBrand,
    GetDeviceOSVersion,
    GetDeviceUniqueId,
};
