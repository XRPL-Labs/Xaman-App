import PushNotificationsService from '../PushNotificationsService';

describe('PushNotificationsService', () => {
    const pushNotificationsService = PushNotificationsService;

    it('should properly initialize', async () => {
        const spy1 = jest.spyOn(pushNotificationsService, 'prepareNotifications');
        const spy2 = jest.spyOn(pushNotificationsService, 'createNotificationListeners');
        await pushNotificationsService.initialize();
        expect(spy1).toBeCalled();
        expect(spy2).toBeCalled();
        expect(pushNotificationsService.initialized).toBe(true);
    });

    it('should request permission and receive it', async () => {
        const hasPermission = await pushNotificationsService.requestPermission();
        expect(hasPermission).toBe(true);
    });

    it('should return true when check for permission', async () => {
        const hasPermission = await pushNotificationsService.checkPermission();
        expect(hasPermission).toBe(true);
    });

    it('should get token from firebase', async () => {
        const token = await pushNotificationsService.getToken();
        expect(token).toBe('token');
    });
});
