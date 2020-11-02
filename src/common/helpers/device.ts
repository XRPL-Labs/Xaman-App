import { Dimensions, Platform, PixelRatio, NativeModules } from 'react-native';

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
 * IOS: Check if device is a IPhoneX
 * @returns boolean
 */

const IsIPhoneX = (): boolean => {
    const { height, width } = Dimensions.get('window');
    return (
        Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTVOS &&
        (height === 812 || width === 812 || height === 896 || width === 896 || height === 926 || width === 926)
    );
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
 * Get the latest real time base on device CPU ticks
 * @returns Promise<number>
 */
const GetElapsedRealtime = (): Promise<number> => {
    return new Promise((resolve) => {
        UtilsModule.getElapsedRealtime().then((ts: string) => {
            return resolve(Number(ts));
        });
    });
};

/**
 * Restart react native bundler
 */
const RestartBundle = (): void => {
    UtilsModule.restartBundle();
};

/**
 * hard close the app proccess
 */
const ExitApp = (): void => {
    NativeModules.exitApp();
};

/* Export ==================================================================== */
export {
    IsIPhoneX,
    IsIOS10,
    GetBottomTabScale,
    IsFlagSecure,
    FlagSecure,
    IsDeviceJailBroken,
    IsDeviceRooted,
    GetDeviceTimeZone,
    GetElapsedRealtime,
    RestartBundle,
    ExitApp,
};
