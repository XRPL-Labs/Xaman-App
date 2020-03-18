import AppStateService, { NetStateStatus } from '../AppStateService';

describe('AppStateService', () => {
    const appStateService = AppStateService;

    it('should properly initialize', async () => {
        const spy1 = jest.spyOn(appStateService, 'setNetInfoListener');
        const spy2 = jest.spyOn(appStateService, 'setAppStateListener');

        await appStateService.initialize();

        expect(spy1).toBeCalled();
        expect(spy2).toBeCalled();
    });

    it('should set NetState', async () => {
        appStateService.setNetState(true);
        expect(appStateService.netStatus).toBe(NetStateStatus.Connected);
        appStateService.setNetState(false);
        expect(appStateService.netStatus).toBe(NetStateStatus.Disconnected);
    });
});
