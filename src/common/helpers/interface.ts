/* eslint-disable operator-linebreak */

import { Platform, ActionSheetIOS, ToastAndroid, Alert, NativeModules } from 'react-native';

const Toast = (message: string, duration?: number) => {
    const toast = Platform.OS === 'android' ? ToastAndroid : NativeModules.Toast;
    toast.showWithGravity(
        message,
        duration === undefined ? toast.SHORT : duration,
        Platform.OS === 'android' ? ToastAndroid.CENTER : 2,
    );
};

const ActionSheet = (options: any, callback: any) => {
    const actionSheet = Platform.OS === 'android' ? NativeModules.ActionSheetAndroid : ActionSheetIOS;
    actionSheet.showActionSheetWithOptions(options, callback);
};

const Prompt = (title: string, message: string, callbackOrButtons: any, options: any) => {
    if (options.type === 'default') {
        // no input needed
        Alert.alert(title, message, callbackOrButtons);
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

        PromptAndroid.promptWithArgs(config, (action: any, buttonKey: any, input: any) => {
            if (action !== PromptAndroid.buttonClicked) {
                return;
            }
            if (buttonKey === PromptAndroid.buttonNeutral) {
                buttonNeutral.onPress && buttonNeutral.onPress(input);
            } else if (buttonKey === PromptAndroid.buttonNegative) {
                buttonNegative.onPress && buttonNegative.onPress();
            } else if (buttonKey === PromptAndroid.buttonPositive) {
                buttonPositive.onPress && buttonPositive.onPress(input);
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
    const { UtilsModule } = NativeModules;
    UtilsModule.hapticFeedback(type);
};

/* Export ==================================================================== */
export { Toast, ActionSheet, Prompt, VibrateHapticFeedback };
