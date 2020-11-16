// hide console.log console.error in jest tests
jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn());
jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn());

// mock native event emitter
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');
