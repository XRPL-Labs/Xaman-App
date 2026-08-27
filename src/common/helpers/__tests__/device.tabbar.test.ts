import { Dimensions, NativeModules, PixelRatio, Platform } from 'react-native';

import { GetBottomTabScale } from '../device';

describe('GetBottomTabScale', () => {
    const originalOS = Platform.OS;

    const apply = ({
        width,
        ratio,
        bottom,
        os,
        platform = 'ios',
        itemHeight = 49,
    }: {
        width: number;
        ratio: number;
        bottom: number;
        os: string;
        platform?: string;
        itemHeight?: number;
    }) => {
        Object.defineProperty(Platform, 'OS', { configurable: true, get: () => platform });
        NativeModules.DeviceUtilsModule.osVersion = os;
        NativeModules.DeviceUtilsModule.layoutInsets = { top: 20, bottom };
        NativeModules.DeviceUtilsModule.tabBarMetrics = {
            itemHeight,
            height: itemHeight + bottom,
        };
        jest.spyOn(Dimensions, 'get').mockReturnValue({
            width,
            height: 800,
            scale: ratio,
            fontScale: 1,
        } as any);
        jest.spyOn(PixelRatio, 'get').mockReturnValue(ratio);
    };

    afterEach(() => {
        Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS });
        jest.restoreAllMocks();
    });

    it('uses the same @2x scale on SE 3rd gen (iOS 26) as on iPhone 8', () => {
        apply({ width: 375, ratio: 2, bottom: 0, os: '26.5' });
        const se = GetBottomTabScale(0.65);

        apply({ width: 375, ratio: 2, bottom: 0, os: '16.7.1' });
        const eight = GetBottomTabScale(0.65);

        apply({ width: 402, ratio: 3, bottom: 34, os: '26.5' });
        const pro = GetBottomTabScale(0.65);

        // SE 3rd gen is 375×667 @2x (750×1334), same panel as iPhone 8 — not @3x.
        // Larger scale → smaller painted icon. Do not use paint=1 on iOS 26 @2x
        // (that was scale ~5.08 and made Xaman-se tiny vs the USB 8).
        expect(se).toBeCloseTo(3.46, 1);
        expect(eight).toBeCloseTo(3.46, 1);
        expect(se).toBeCloseTo(eight, 2);
        expect(pro).toBeCloseTo(3.88, 1);
        expect(se).toBeLessThan(4.2);
    });

    it('keeps the iPhone 8 @2x compensation', () => {
        apply({ width: 375, ratio: 2, bottom: 0, os: '16.7.1' });
        expect(GetBottomTabScale(0.65)).toBeCloseTo(3.46, 1);
    });

    it('does not apply iOS scale on Android', () => {
        apply({ width: 411, ratio: 2.625, bottom: 24, os: '14', platform: 'android' });
        expect(GetBottomTabScale(0.65)).toBe(0);
    });
});
