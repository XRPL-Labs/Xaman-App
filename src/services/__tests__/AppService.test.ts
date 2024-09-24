import Preferences from '@common/libs/preferences';
import * as AppHelpers from '@common/helpers/app';

import AppService, { NetStateStatus, AppStateStatus } from '../AppService';

describe('AppService', () => {
    const appService = AppService;

    it('should properly initialize', async () => {
        const spy1 = jest.spyOn(appService, 'setNetInfoListener');
        const spy2 = jest.spyOn(appService, 'setAppStateListener');

        await appService.initialize();

        expect(spy1).toBeCalled();
        expect(spy2).toBeCalled();

        spy1.mockRestore();
        spy2.mockRestore();
    });

    it('should set NetState', async () => {
        appService.setNetState(true);
        expect(appService.netStatus).toBe(NetStateStatus.Connected);
        appService.setNetState(false);
        expect(appService.netStatus).toBe(NetStateStatus.Disconnected);
    });

    it('should call right functions on app state change', async () => {
        const spy1 = jest.spyOn(appService, 'startInactivityTimer');
        const spy2 = jest.spyOn(appService, 'stopInactivityListener');

        // going to background
        appService.handleAppStateChange('background');
        expect(appService.prevAppState).toBe(AppStateStatus.Active);
        expect(appService.currentAppState).toBe(AppStateStatus.Background);
        expect(spy1).toBeCalled();

        // fake inactivity timeout event
        appService.onInactivityTimeout('timeout_event');
        expect(appService.prevAppState).toBe(AppStateStatus.Background);
        expect(appService.currentAppState).toBe(AppStateStatus.Inactive);

        // going to active
        appService.handleAppStateChange('active');
        expect(appService.prevAppState).toBe(AppStateStatus.Inactive);
        expect(appService.currentAppState).toBe(AppStateStatus.Active);
        expect(spy2).toBeCalled();

        appService.handleAppStateChange('inactive');
        expect(appService.prevAppState).toBe(AppStateStatus.Inactive);
        expect(appService.currentAppState).toBe(AppStateStatus.Active);

        spy1.mockRestore();
        spy2.mockRestore();
    });

    it('should record the latest update version to the store', async () => {
        const spyUpdateVersionCode = jest.spyOn(Preferences, 'set');

        // mock current app version
        const spy1 = jest.spyOn(AppHelpers, 'GetAppVersionCode').mockImplementation(() => '0.5.1');
        const spy2 = jest.spyOn(Preferences, 'get').mockImplementation(async () => '0.4.9');

        await appService.checkVersionChange();

        expect(spyUpdateVersionCode).toBeCalledWith(Preferences.keys.LATEST_VERSION_CODE, '0.5.1');

        spy1.mockRestore();
        spy2.mockRestore();
    });
});
