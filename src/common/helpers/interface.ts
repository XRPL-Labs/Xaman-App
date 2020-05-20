/* eslint-disable operator-linebreak */

import {
    Dimensions,
    Platform,
    PixelRatio,
    StatusBar,
    ActionSheetIOS,
    ToastAndroid,
    Alert,
    NativeModules,
} from 'react-native';

const IsIPhoneX = (): boolean => {
    const { height, width } = Dimensions.get('window');
    return (
        Platform.OS === 'ios' &&
        !Platform.isPad &&
        !Platform.isTVOS &&
        (height === 812 || width === 812 || height === 896 || width === 896)
    );
};

const getStatusBarHeight = (skipAndroid?: boolean) => {
    return Platform.select({
        ios: IsIPhoneX() ? 44 : 20,
        android: skipAndroid ? 0 : StatusBar.currentHeight,
        default: 0,
    });
};

const getBottomTabsHeight = (): number => {
    if (Platform.OS === 'ios') {
        return IsIPhoneX() ? 95 : 60;
    }

    if (Platform.OS === 'android') {
        return 60;
    }

    return 0;
};

const getNavigationBarHeight = (): number => {
    if (Platform.OS === 'android') {
        const screenHeight = Dimensions.get('screen').height;
        const windowHeight = Dimensions.get('window').height;
        const height = screenHeight - windowHeight;

        return height;
    }

    return 0;
};

const getBottomTabScale = (factor?: number): number => {
    if (Platform.OS !== 'ios') return 0;
    const ratio = PixelRatio.get();

    let scale;
    switch (ratio) {
        case 2:
            scale = 4.5;
            break;
        case 3:
            scale = 6;
            break;
        default:
            scale = ratio * 2;
    }

    if (factor) {
        return scale * factor;
    }

    return scale;
};

const isIOS10 = (): boolean => {
    if (Platform.OS !== 'ios') return false;

    // @ts-ignore
    const majorVersionIOS = parseInt(Platform.Version, 10);

    if (majorVersionIOS <= 10) {
        return true;
    }

    return false;
};

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
export {
    IsIPhoneX,
    isIOS10,
    getStatusBarHeight,
    getNavigationBarHeight,
    getBottomTabScale,
    getBottomTabsHeight,
    Toast,
    ActionSheet,
    Prompt,
    VibrateHapticFeedback,
};
