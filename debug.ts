/* eslint-disable */

import Reactotron from 'reactotron-react-native';

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
            IGNORED_WARNINGS.some(ignoredWarning => args[0].startsWith(ignoredWarning))
        ) {
            return;
        }

        return oldConsoleWarn.apply(console, args);
    };

    console.disableYellowBox = true;

    // debugger config
    Reactotron.configure({
        name: 'XUMM',
        host: '10.100.11.2',
    })
        .useReactNative()
        .connect();

    // Let's clear Reactotron on every time we load the app
    Reactotron.clear();

    // this allows you to not both importing reactotron-react-native
    // on every file.  This is just DEV mode, so no big deal.
    // @ts-ignore
    console.debugger = Reactotron;
}
