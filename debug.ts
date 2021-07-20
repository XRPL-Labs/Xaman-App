/* eslint-disable */
import { LogBox } from 'react-native';

if (__DEV__) {
    // disable some uneccery logs
    const IGNORED_WARNINGS = ['Setting a timer', 'Warning: Failed prop type:'];
    const IGNORED_LOGS = ['Running "'];

    const oldConsoleWarn = console.warn;
    const oldConsoleLog = console.log;

    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            IGNORED_WARNINGS.some((ignoredWarning) => args[0].startsWith(ignoredWarning))
        ) {
            return;
        }

        return oldConsoleWarn.apply(console, args);
    };

    console.log = (...args) => {
        if (typeof args[0] === 'string' && IGNORED_LOGS.some((ignoredLog) => args[0].startsWith(ignoredLog))) {
            return;
        }

        return oldConsoleLog.apply(console, args);
    };

    LogBox.ignoreLogs(IGNORED_WARNINGS);
    LogBox.ignoreAllLogs();
}
