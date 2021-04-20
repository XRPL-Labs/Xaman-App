// hide console.log console.error in jest tests
jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn());
jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn());
jest.spyOn(global.console, 'debug').mockImplementation(() => jest.fn());

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter.js');
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

process.env.REALM_DISABLE_ANALYTICS = true;
