import { Platform, PixelRatio, NativeModules, Dimensions } from 'react-native';

const { DeviceUtilsModule, UniqueIdProviderModule } = NativeModules;

/**
 * Get window layout insets
 * @returns {top: 0, bottom: 0}
 */
const GetLayoutInsets = (): { top: number; bottom: number } => {
    return DeviceUtilsModule.layoutInsets;
};

/**
 * Check if device have bottom notch
 * @returns boolean
 */
const HasBottomNotch = (): boolean => {
    if (Platform.OS === 'ios') {
        const { bottom } = GetLayoutInsets();
        return bottom > 0;
    }
    return false;
};

/**
 * Check if device have bottom notch
 * @returns boolean
 */
const HasTopNotch = (): boolean => {
    // TODO: check for android devices
    if (Platform.OS === 'ios') {
        const { top } = GetLayoutInsets();
        return top > 20;
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

const TAB_COUNT = 5;
const TAB_ASSET_PT = 64;
const DEFAULT_ITEM_ROW = 49;
const SE_WIDTH = 375;
const TAB_CHROME_EXPONENT = 0.22;
// Center dock occupies this fraction of the compact 49pt item row (~25.2pt).
const CENTER_OF_ITEM_ROW = 0.514;

const tabBarItemRow = (): number => {
    const h = Number(DeviceUtilsModule.tabBarMetrics?.itemHeight);
    return Number.isFinite(h) && h > 0 ? h : DEFAULT_ITEM_ROW;
};

/**
 * Displayed center-dock size (points/dp). Same 0.65/0.9 factors as the tab icons.
 *
 * Sized from the compact tab-bar *item row* (49pt) plus a damped extra for
 * home-indicator chrome. Slot width still grows SE 375 → Pro ~402.
 *
 * iOS UITabBar paint is not 1:1 with UIImage.pointSize. That tracks the
 * loaded asset's pixel buffer (PixelRatio), not notch / iOS version:
 * iPhone SE 3rd gen is the same 375×667 @2x panel as iPhone 8 (750×1334),
 * not @3x like 17 Pro. Treating “iOS 26 @2x” as 1:1 paint made Xaman-se
 * tiny next to the USB iPhone 8.
 */
const getTabIconDisplayPt = (factor?: number): number => {
    const { width } = Dimensions.get('window');
    const inset = GetLayoutInsets()?.bottom || 0;
    const itemRow = tabBarItemRow();
    const slot = width / TAB_COUNT;
    const bar = itemRow + (Platform.OS === 'ios' ? inset : 0);
    const f = factor || 1;
    const seCenter = itemRow * CENTER_OF_ITEM_ROW;
    const fromSlot = seCenter * (slot / (SE_WIDTH / TAB_COUNT)) * (0.65 / f);
    const chrome = Math.pow(Math.max(bar, itemRow) / itemRow, TAB_CHROME_EXPONENT);
    return fromSlot * chrome;
};

const tabBarPaintEfficiency = (): number => {
    if (Platform.OS !== 'ios') {
        return 1;
    }
    // @3x catalog is 192px; @2x is 128px. SE 3rd gen and iPhone 8 are both @2x.
    return (PixelRatio.get() || 2) >= 3 ? 0.61 : 0.68;
};

/**
 * iOS RNN `icon.scale` (UIImage.scale). Point size = 64pt * PixelRatio / scale.
 */
const GetBottomTabScale = (factor?: number): number => {
    if (Platform.OS !== 'ios') return 0;
    const displayPt = getTabIconDisplayPt(factor);
    const requested = displayPt / tabBarPaintEfficiency();
    const ratio = PixelRatio.get() || 2;
    return (TAB_ASSET_PT * ratio) / requested;
};

/**
 * Android RNN `iconWidth` / `iconHeight` in dp (AHBottomNavigation dpToPx, 1:1).
 * Independent of iOS 25pt target — 20–28dp looked tiny next to the iOS dock.
 */
const ANDROID_CENTER_DP = 44;
const ANDROID_CENTER_CAP = 52;
const ANDROID_SIDE_CAP = 34;

const GetBottomTabIconDp = (factor?: number): number => {
    const isCenter = (factor || 1) < 0.8;
    if (Platform.OS !== 'android') {
        const displayPt = getTabIconDisplayPt(factor);
        return Math.round(Math.min(displayPt, isCenter ? 36 : 26));
    }
    const { width } = Dimensions.get('window');
    const slot = width / TAB_COUNT;
    const f = factor || 1;
    const fromSlot = ANDROID_CENTER_DP * (slot / (SE_WIDTH / TAB_COUNT)) * (0.65 / f);
    return Math.round(Math.min(fromSlot, isCenter ? ANDROID_CENTER_CAP : ANDROID_SIDE_CAP));
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

/**
 * Android: hide the native boot image after the first screen has painted.
 */
const HideLaunchSplash = (): void => {
    if (Platform.OS !== 'android' || typeof DeviceUtilsModule?.hideLaunchSplash !== 'function') {
        return;
    }
    DeviceUtilsModule.hideLaunchSplash();
};

/* Export ==================================================================== */
export {
    HasBottomNotch,
    HasTopNotch,
    GetBottomTabScale,
    GetBottomTabIconDp,
    GetLayoutInsets,
    IsDeviceJailBroken,
    IsDeviceRooted,
    GetDeviceTimeZone,
    GetDeviceLocaleSettings,
    GetElapsedRealtime,
    GetDeviceBrand,
    GetDeviceOSVersion,
    GetDeviceUniqueId,
    HideLaunchSplash,
};
