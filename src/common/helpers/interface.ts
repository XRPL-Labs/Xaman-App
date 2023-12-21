import {
    Platform,
    ActionSheetIOS,
    ToastAndroid,
    Alert,
    NativeModules,
    AlertOptions,
    ActionSheetIOSOptions,
} from 'react-native';

interface PromptOptions extends AlertOptions {
    type?: 'default' | 'plain-text';
    defaultValue?: string;
    keyboardType?: any;
    style?: string;
    placeholder?: string;
}

const Toast = (message: string, duration?: number) => {
    const toast = Platform.OS === 'android' ? ToastAndroid : NativeModules.Toast;
    toast.showWithGravity(
        message,
        duration === undefined ? toast.SHORT : duration,
        Platform.OS === 'android' ? ToastAndroid.CENTER : 2,
    );
};

const ActionSheet = (options: ActionSheetIOSOptions, callback: any, style?: 'dark' | 'light') => {
    const defaultOptions = { userInterfaceStyle: style || 'light' };
    const actionSheet = Platform.OS === 'android' ? NativeModules.ActionSheetAndroid : ActionSheetIOS;
    actionSheet.showActionSheetWithOptions({ ...defaultOptions, ...options }, callback);
};

const Prompt = (title: string, message: string, callbackOrButtons?: any, options?: PromptOptions) => {
    if (!callbackOrButtons || !options || options.type === 'default') {
        // no input needed
        Alert.alert(title, message, callbackOrButtons, options);
    } else {
        // if use need to input beside alert

        // platform === ios
        if (Platform.OS === 'ios') {
            Alert.prompt(title, message, callbackOrButtons, options.type, options.defaultValue, options.keyboardType);
            return;
        }

        // platform === android
        const { PromptAndroid } = NativeModules;
        const defaultButtons = [
            {
                text: 'Cancel',
            },
            {
                text: 'OK',
                onPress: callbackOrButtons,
            },
        ];

        const buttons = typeof callbackOrButtons === 'function' ? defaultButtons : callbackOrButtons;

        let config = {
            title: title || '',
            message: message || '',
        } as any;

        if (options) {
            config = {
                ...config,
                cancelable: options.cancelable !== false,
                type: options.type || 'default',
                style: options.style || 'default',
                defaultValue: options.defaultValue || '',
                placeholder: options.placeholder || '',
            };
        }
        // At most three buttons (neutral, negative, positive). Ignore rest.
        // The text 'OK' should be probably localized. iOS Alert does that in native.
        const validButtons = buttons ? buttons.slice(0, 3) : [{ text: 'OK' }];
        const buttonPositive = validButtons.pop();
        const buttonNegative = validButtons.pop();
        const buttonNeutral = validButtons.pop();

        if (buttonNeutral) {
            config = { ...config, buttonNeutral: buttonNeutral.text || '' };
        }
        if (buttonNegative) {
            config = { ...config, buttonNegative: buttonNegative.text || '' };
        }
        if (buttonPositive) {
            config = {
                ...config,
                buttonPositive: buttonPositive.text || '',
            };
        }

        PromptAndroid.promptWithArgs(config, (action: string, buttonKey: string, input: string) => {
            if (action !== PromptAndroid.buttonClicked) {
                return;
            }
            if (buttonKey === PromptAndroid.buttonNeutral) {
                typeof buttonNeutral.onPress === 'function' && buttonNeutral.onPress(input);
            } else if (buttonKey === PromptAndroid.buttonNegative) {
                typeof buttonNegative.onPress === 'function' && buttonNegative.onPress();
            } else if (buttonKey === PromptAndroid.buttonPositive) {
                typeof buttonPositive.onPress === 'function' && buttonPositive.onPress(input);
            }
        });
    }
};

const VibrateHapticFeedback = (
    type:
        | 'impactLight'
        | 'impactMedium'
        | 'impactHeavy'
        | 'notificationSuccess'
        | 'notificationWarning'
        | 'notificationError',
) => {
    const { HapticFeedbackModule } = NativeModules;
    HapticFeedbackModule.trigger(type);
};

/* Export ==================================================================== */
export { Toast, ActionSheet, Prompt, VibrateHapticFeedback };
