import messaging from '@react-native-firebase/messaging';

export default () => ({
    hasPermission: jest.fn(() => Promise.resolve(1)),
    subscribeToTopic: jest.fn(),
    unsubscribeFromTopic: jest.fn(),
    requestPermission: jest.fn(() => Promise.resolve(messaging.AuthorizationStatus.AUTHORIZED)),
    getToken: jest.fn(() => Promise.resolve('token')),
    onMessage: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
    getInitialNotification: jest.fn(() => Promise.resolve(false)),
});
