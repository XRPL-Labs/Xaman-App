import Locale from '@locale';
import moment from 'moment-timezone';

const logs = process.env?.LOGS ?? false;

/* Hide console in jest tests */
if (logs) {
    jest.spyOn(global.console, 'log').mockImplementation(() => jest.fn());
    jest.spyOn(global.console, 'error').mockImplementation(() => jest.fn());
    jest.spyOn(global.console, 'debug').mockImplementation(() => jest.fn());
    jest.spyOn(global.console, 'warn').mockImplementation(() => jest.fn());
}

/* Mock RNN event listeners */
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter.js');
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

/* Realm */
process.env.REALM_DISABLE_ANALYTICS = true;

// Localization
Locale.setLocale('EN');
moment.tz.setDefault('Europe/Amsterdam');
