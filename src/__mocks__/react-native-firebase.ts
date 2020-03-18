/* eslint-disable  spellcheck/spell-checker */

const firebase = {
    analytics: jest.fn(() => ({
        setAnalyticsCollectionEnabled: jest.fn(),
        setCurrentScreen: jest.fn(),
        logEvent: jest.fn(),
        setUserId: jest.fn(),
    })),
    auth: jest.fn(() => ({
        signOut: jest.fn(() => Promise.resolve({})),
        signInAnonymously: jest.fn(() => Promise.resolve({})),
        signInWithEmailAndPassword: jest.fn(() => Promise.resolve({})),
        createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({})),
        sendPasswordResetEmail: jest.fn(() => Promise.resolve()),
    })),
    crashlytics: jest.fn(() => ({
        crash: jest.fn(),
        enableCrashlyticsCollection: jest.fn(),
    })),
    messaging: jest.fn(() => ({
        hasPermission: jest.fn(() => Promise.resolve(true)),
        requestPermission: jest.fn(() => Promise.resolve(true)),
        getToken: jest.fn(() => Promise.resolve('token')),
    })),
    notifications: jest.fn(() => ({
        onNotification: jest.fn(),
        onNotificationOpened: jest.fn(),
        getInitialNotification: jest.fn(() => Promise.resolve(true)),
    })),
};

export default firebase;
