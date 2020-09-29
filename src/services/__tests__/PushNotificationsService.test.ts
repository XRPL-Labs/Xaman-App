import { NativeModules } from 'react-native';

import messaging from '@react-native-firebase/messaging';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { Payload } from '@common/libs/payload';

import PushNotificationsService from '../PushNotificationsService';
import NavigationService from '../NavigationService';

messaging.AuthorizationStatus = {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
};

const signRequestMessage = {
    messageId: '1600090805361973',
    data: { category: 'SIGNTX', payload: 'c2625db5-cb34-4831-86d4-bf9f2d9285b7' },
    category: 'OPENPAYLOAD',
    notification: {
        ios: { subtitle: '𝗭𝗮𝗹𝗮𝗻𝗱𝗼' },
        title: 'Sign request',
        sound: 'default',
        body: 'Payment: €100',
    },
};

const notificationOpen = {
    category: 'OPENPAYLOAD',
    data: { category: 'SIGNTX', payload: 'c2625db5-cb34-4831-86d4-bf9f2d9285b7' },
    messageId: '1600091878699703',
    notification: { body: 'Payment: €100', ios: { subtitle: '𝗭𝗮𝗹𝗮𝗻𝗱𝗼' }, sound: 'default', title: 'Sign request' },
};

const { LocalNotificationModule } = NativeModules;

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

    it('should show sign request notification', async () => {
        const spy1 = jest.spyOn(LocalNotificationModule, 'complete');
        const spy2 = jest.spyOn(pushNotificationsService, 'emit');

        NavigationService.currentScreen = AppScreens.TabBar.Home;

        pushNotificationsService.handleNotification(signRequestMessage);

        expect(spy1).toBeCalledWith(signRequestMessage.messageId, true);
        expect(spy2).toBeCalledWith('signRequestUpdate');
    });

    it('should not show sign request when in review transaction screen', async () => {
        const spy1 = jest.spyOn(LocalNotificationModule, 'complete');

        NavigationService.currentScreen = AppScreens.Modal.ReviewTransaction;

        pushNotificationsService.handleNotification(signRequestMessage);

        expect(spy1).toBeCalledWith(signRequestMessage.messageId, false);
    });

    it('should handle opening sign request', async () => {
        const spy1 = jest.spyOn(Navigator, 'showModal');

        // mock the ledger service response
        const spy = jest.spyOn(Payload, 'from').mockImplementation(async () => {
            return new Payload();
        });

        await pushNotificationsService.handleNotificationOpen(notificationOpen);

        expect(spy1).toBeCalled();
        spy.mockRestore();
    });
});
