import { Platform, Keyboard as RNKeyboard, NativeModules, DeviceEventEmitter } from 'react-native';

const { KeyboardModule } = NativeModules;

// indicator for number of listeners on android
let numberAndroidListeners = 0;

const getEventName = (eventName: string): any => {
    switch (eventName) {
        case 'keyboardWillShow':
            return Platform.select({
                android: 'KeyboardShow',
                ios: 'keyboardWillShow',
            });
        case 'keyboardWillHide':
            return Platform.select({
                android: 'KeyboardHide',
                ios: 'keyboardWillHide',
            });
        default:
            return eventName;
    }
};

const Keyboard = {
    addListener: (event: string, handler: any) => {
        const eventName = getEventName(event);
        if (Platform.OS === 'android') {
            if (numberAndroidListeners === 0) {
                KeyboardModule.startKeyboardListener();
            }

            numberAndroidListeners += 1;

            DeviceEventEmitter.addListener(eventName, handler);
        } else {
            RNKeyboard.addListener(eventName, handler);
        }
    },
    removeListener: (event: string, handler: any) => {
        const eventName = getEventName(event);

        if (Platform.OS === 'android') {
            numberAndroidListeners -= 1;

            if (numberAndroidListeners === 0) {
                KeyboardModule.stopKeyboardListen();
            }

            DeviceEventEmitter.removeListener(eventName, handler);
        } else {
            RNKeyboard.removeListener(eventName, handler);
        }
    },

    dismiss: RNKeyboard.dismiss,
};

export { Keyboard };
