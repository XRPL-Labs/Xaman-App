/* eslint-disable */
import { LogBox } from 'react-native';

if (__DEV__) {
    // disable some yellow boxes
    const IGNORED_WARNINGS = [
        'Remote debugger is in a background tab which may cause apps to perform slowly',
        'Require cycle:',
        'Setting a timer',
    ];
    const oldConsoleWarn = console.warn;

    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            IGNORED_WARNINGS.some((ignoredWarning) => args[0].startsWith(ignoredWarning))
        ) {
            return;
        }

        return oldConsoleWarn.apply(console, args);
    };

    LogBox.ignoreLogs(IGNORED_WARNINGS);
}
