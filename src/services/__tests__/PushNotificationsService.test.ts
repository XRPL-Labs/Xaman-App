import { NativeModules } from 'react-native';

import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { Payload, PayloadOrigin } from '@common/libs/payload';

import PushNotificationsService from '../PushNotificationsService';
import NavigationService from '../NavigationService';

jest.mock('@react-native-firebase/messaging');

const { LocalNotificationModule } = NativeModules;

describe('PushNotificationsService', () => {
    const pushNotificationsService = PushNotificationsService;
    const navigationService = NavigationService;

    const signRequestMessage = {
        messageId: '1600090805361973',
        data: { category: 'SIGNTX', payload: 'c2625db5-cb34-4831-86d4-bf9f2d9285b7' },
        notification: {
            ios: { subtitle: '𝗭𝗮𝗹𝗮𝗻𝗱𝗼' },
            title: 'Sign request',
            sound: 'default',
            body: 'Payment: €100',
        },
        fcmOptions: {},
    } as FirebaseMessagingTypes.RemoteMessage;

    const notificationOpen = {
        messageId: '1600091878699703',
        data: { category: 'SIGNTX', payload: 'c2625db5-cb34-4831-86d4-bf9f2d9285b7' },
        notification: { body: 'Payment: €100', ios: { subtitle: 'Xaman' }, sound: 'default', title: 'Sign request' },
        fcmOptions: {},
    } as FirebaseMessagingTypes.RemoteMessage;

    it('should properly initialize', async () => {
        const spy = jest.spyOn(pushNotificationsService, 'createNotificationListeners');
        await pushNotificationsService.initialize();
        expect(spy).toBeCalled();
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

        // @ts-ignore
        jest.replaceProperty(NavigationService, 'currentScreen', AppScreens.TabBar.Home);

        pushNotificationsService.handleNotification(signRequestMessage);

        expect(spy1).toBeCalledWith(signRequestMessage.messageId, true);
        expect(spy2).toBeCalledWith('signRequestUpdate');
    });

    it('should not show sign request when in review transaction screen', async () => {
        const spy1 = jest.spyOn(LocalNotificationModule, 'complete');

        // @ts-ignore
        jest.replaceProperty(navigationService, 'modals', [AppScreens.Modal.ReviewTransaction]);

        pushNotificationsService.handleNotification(signRequestMessage);

        expect(spy1).toBeCalledWith(signRequestMessage.messageId, false);
    });

    it('should handle opening sign request', async () => {
        // @ts-ignore
        jest.replaceProperty(navigationService, 'modals', []);

        const spy0 = jest.spyOn(Payload, 'from').mockImplementation(async () => {
            return new Payload();
        });
        const spy1 = jest.spyOn(Navigator, 'showModal');

        // call
        pushNotificationsService.handleNotificationOpen(notificationOpen);

        // wait
        await new Promise((resolve) => {
            setTimeout(resolve, 300);
        });

        expect(spy0).toBeCalledWith(notificationOpen?.data?.payload, PayloadOrigin.PUSH_NOTIFICATION);
        expect(spy1).toBeCalledWith(
            AppScreens.Modal.ReviewTransaction,
            { payload: expect.any(Payload), componentType: 'MODAL' },
            { modalPresentationStyle: 'fullScreen' },
        );

        spy0.mockRestore();
        spy1.mockRestore();
    });
});
