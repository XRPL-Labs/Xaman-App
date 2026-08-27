import { NativeModules, Platform } from 'react-native';

import { IsFlagSecure, SetFlagSecure } from '../app';

describe('SetFlagSecure', () => {
    const originalOS = Platform.OS;

    beforeEach(() => {
        Object.defineProperty(Platform, 'OS', { configurable: true, get: () => 'android' });
        NativeModules.AppUtilsModule.isDebug = false;
        NativeModules.AppUtilsModule.setFlagSecure.mockClear();
        NativeModules.AppUtilsModule.isFlagSecure.mockClear();
    });

    afterEach(() => {
        Object.defineProperty(Platform, 'OS', { configurable: true, get: () => originalOS });
        NativeModules.AppUtilsModule.isDebug = false;
    });

    it('debug build never enables FLAG_SECURE', () => {
        NativeModules.AppUtilsModule.isDebug = true;
        SetFlagSecure(true);
        expect(NativeModules.AppUtilsModule.setFlagSecure).toHaveBeenCalledWith(false);
    });

    it('release build can enable FLAG_SECURE', () => {
        SetFlagSecure(true);
        expect(NativeModules.AppUtilsModule.setFlagSecure).toHaveBeenCalledWith(true);
    });

    it('debug build reports FLAG_SECURE off', async () => {
        NativeModules.AppUtilsModule.isDebug = true;
        await expect(IsFlagSecure()).resolves.toBe(false);
        expect(NativeModules.AppUtilsModule.isFlagSecure).not.toHaveBeenCalled();
    });
});
