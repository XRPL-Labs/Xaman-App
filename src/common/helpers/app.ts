import { NativeModules, Platform } from 'react-native';

const { AppUtilsModule } = NativeModules;

/**
 * Get current app version
 */
const GetAppVersionCode = (): string => {
    return AppUtilsModule.appVersion;
};

/**
 * Get current app build number
 */
const GetAppBuildNumber = (): string => {
    return AppUtilsModule.buildNumber;
};

/**
 * Get a readable app version, combination of app version code and build number
 */
const GetAppReadableVersion = (): string => {
    return `${GetAppVersionCode()}.${GetAppBuildNumber()}`;
};

/**
 * Check if app is running in debug or release build
 */
const IsDebugBuild = (): boolean => {
    return AppUtilsModule.isDebug;
};

/**
 * Android: Check if flagSecure is set on current activity
 * @returns Promise<boolean>
 */
const IsFlagSecure = (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
        return Promise.resolve(false);
    }
    return AppUtilsModule.isFlagSecure();
};

/**
 * Android: turn on/off flagSecure flag on current activity
 */
const SetFlagSecure = (enable: boolean): void => {
    if (Platform.OS !== 'android') {
        return;
    }
    AppUtilsModule.setFlagSecure(enable);
};

/**
 * Restart react native bundle
 */
const RestartBundle = (): void => {
    AppUtilsModule.restartBundle();
};

/**
 * hard close the app process
 */
const ExitApp = (): void => {
    AppUtilsModule.exitApp();
};

/* Export ==================================================================== */
export {
    GetAppVersionCode,
    GetAppBuildNumber,
    GetAppReadableVersion,
    IsDebugBuild,
    IsFlagSecure,
    SetFlagSecure,
    RestartBundle,
    ExitApp,
};
