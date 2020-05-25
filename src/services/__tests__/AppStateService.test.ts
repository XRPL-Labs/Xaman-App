import AppService, { NetStateStatus } from '../AppService';

describe('AppService', () => {
    const appService = AppService;

    it('should properly initialize', async () => {
        const spy1 = jest.spyOn(appService, 'setNetInfoListener');
        const spy2 = jest.spyOn(appService, 'setAppStateListener');

        await appService.initialize();

        expect(spy1).toBeCalled();
        expect(spy2).toBeCalled();
    });

    it('should set NetState', async () => {
        appService.setNetState(true);
        expect(appService.netStatus).toBe(NetStateStatus.Connected);
        appService.setNetState(false);
        expect(appService.netStatus).toBe(NetStateStatus.Disconnected);
    });
});
