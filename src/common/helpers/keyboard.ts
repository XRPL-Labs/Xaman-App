import { Platform, Keyboard as RNKeyboard, NativeModules, DeviceEventEmitter, EmitterSubscription } from 'react-native';

const { KeyboardModule } = NativeModules;

type EventTypes = 'keyboardWillShow' | 'keyboardWillHide' | 'KeyboardShow' | 'KeyboardHide';

class Keyboard {
    private subscriptions: any;
    private keyboardListenerStarted: boolean;

    constructor() {
        this.subscriptions = {};

        this.keyboardListenerStarted = false;
    }

    getNormalizedEventName = (eventName: EventTypes): EventTypes => {
        switch (eventName) {
            case 'keyboardWillShow':
                return Platform.select({
                    android: 'KeyboardShow',
                    ios: 'keyboardWillShow',
                    default: eventName,
                });
            case 'keyboardWillHide':
                return Platform.select({
                    android: 'KeyboardHide',
                    ios: 'keyboardWillHide',
                    default: eventName,
                });
            default:
                return eventName;
        }
    };

    shouldStartKeyboardListener = (): boolean => {
        if (Platform.OS !== 'android') {
            return false;
        }
        return !this.keyboardListenerStarted && Object.keys(this.subscriptions).length > 0;
    };

    shouldSopKeyboardListener = (): boolean => {
        if (Platform.OS !== 'android') {
            return false;
        }
        return this.keyboardListenerStarted && Object.keys(this.subscriptions).length === 0;
    };

    addSubscription = (eventType: EventTypes, subscription: EmitterSubscription) => {
        if (!this.subscriptions[eventType]) {
            this.subscriptions[eventType] = [];
        }
        this.subscriptions[eventType].push(subscription);
    };

    removeSubscription = (eventType: EventTypes, handler: any) => {
        if (!this.subscriptions[eventType] || this.subscriptions[eventType].length === 0) {
            return;
        }

        for (let i = 0, l = this.subscriptions[eventType].length; i < l; i++) {
            const subscription = this.subscriptions[eventType][i];

            if (subscription && subscription.listener === handler) {
                subscription.remove();

                this.subscriptions[eventType].splice(i, 1);

                if (this.subscriptions[eventType].length === 0) {
                    delete this.subscriptions[eventType];
                }
            }
        }
    };

    addListener = (eventType: EventTypes, handler: any) => {
        const eventName = this.getNormalizedEventName(eventType);

        let subscription;

        switch (Platform.OS) {
            case 'android':
                subscription = DeviceEventEmitter.addListener(eventName, handler);
                break;
            case 'ios':
                // @ts-expect-error
                subscription = RNKeyboard.addListener(eventName, handler);
                break;
            default:
                break;
        }

        if (subscription) {
            this.addSubscription(eventName, subscription);

            if (this.shouldStartKeyboardListener()) {
                this.keyboardListenerStarted = true;
                KeyboardModule.startKeyboardListener();
            }
        }
    };

    removeListener = (eventType: EventTypes, handler: any) => {
        const eventName = this.getNormalizedEventName(eventType);

        this.removeSubscription(eventName, handler);

        if (this.shouldSopKeyboardListener()) {
            this.keyboardListenerStarted = false;
            KeyboardModule.stopKeyboardListen();
        }
    };

    dismiss = () => RNKeyboard.dismiss;
}

export default new Keyboard();
