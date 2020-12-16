/* eslint-disable react/jsx-props-no-spreading */
/**
 * TextInput
 *
    <TextInput />
 *
 */
import React, { Component } from 'react';
import {
    View,
    TouchableHighlight,
    TextInput,
    ActivityIndicator,
    TextInputProps,
    ViewStyle,
    TextStyle,
    Platform,
} from 'react-native';

import { StringType } from 'xumm-string-decode';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Icon } from '@components/General/Icon';

import { AppColors, AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props extends TextInputProps {
    containerStyle?: ViewStyle;
    activeContainerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    activeInputStyle?: TextStyle;
    showScanner?: boolean;
    scannerType?: StringType;
    onScannerRead?: (decoded: any) => void;
    onScannerOpen?: () => void;
    onScannerClose?: () => void;
    scannerFallback?: boolean;
    isLoading?: boolean;
}

interface State {
    focused: boolean;
}

/* Constants ==================================================================== */
const DEFAULT_KEYBAORDTYPES = ['default', 'email-address', 'numeric', 'phone-pad', 'number-pad', 'decimal-pad'];
const IOS_KEYBAORDTYPES = [
    'ascii-capable',
    'numbers-and-punctuation',
    'url',
    'name-phone-pad',
    'twitter',
    'web-search',
];
const ANDROID_KEYBAORDTYPES = ['visible-password'];

/* Component ==================================================================== */
class Input extends Component<Props, State> {
    instance: TextInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            focused: false,
        };
    }

    public focus = () => {
        setTimeout(() => {
            if (this.instance) {
                this.instance.focus();
            }
        }, 50);
    };

    public blur = () => {
        setTimeout(() => {
            if (this.instance) {
                this.instance.blur();
            }
        }, 50);
    };

    onFocus = (e: any) => {
        const { onFocus } = this.props;

        this.setState({ focused: true });

        if (onFocus) {
            onFocus(e);
        }
    };

    onBlur = (e: any) => {
        const { onBlur } = this.props;

        this.setState({ focused: false });

        if (onBlur) {
            onBlur(e);
        }
    };

    renderInput = () => {
        const { focused } = this.state;
        const {
            containerStyle,
            activeContainerStyle,
            activeInputStyle,
            inputStyle,
            showScanner,
            keyboardType,
            autoCapitalize,
        } = this.props;

        const filteredProps = { ...this.props };

        const scannerPadding = showScanner
            ? AppSizes.heightPercentageToDP(5.5) < 45
                ? 38
                : AppSizes.heightPercentageToDP(5.5)
            : 0;

        // fix keyboard type for both ios and android
        if (keyboardType) {
            if (
                (Platform.OS === 'ios' &&
                    [...DEFAULT_KEYBAORDTYPES, ...IOS_KEYBAORDTYPES].indexOf(keyboardType) === -1) ||
                (Platform.OS === 'android' &&
                    [...DEFAULT_KEYBAORDTYPES, ...ANDROID_KEYBAORDTYPES].indexOf(keyboardType) === -1)
            ) {
                delete filteredProps.keyboardType;
            }
        }

        return (
            <View style={[styles.wrapper, containerStyle, focused && activeContainerStyle]}>
                <TextInput
                    ref={(r) => {
                        this.instance = r;
                    }}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    placeholderTextColor={AppColors.greyDark}
                    autoCapitalize={autoCapitalize || 'none'}
                    autoCorrect={false}
                    multiline={false}
                    underlineColorAndroid="transparent"
                    style={[styles.input, { paddingRight: scannerPadding }, inputStyle, focused && activeInputStyle]}
                    {...filteredProps}
                />
            </View>
        );
    };

    showScanner = () => {
        const { onScannerOpen, onScannerClose, onScannerRead, scannerType, scannerFallback } = this.props;

        if (typeof onScannerOpen === 'function') {
            onScannerOpen();
        }

        Navigator.showModal(
            AppScreens.Modal.Scan,
            {},
            {
                type: scannerType,
                onRead: onScannerRead,
                onClose: onScannerClose,
                fallback: scannerFallback,
            },
        );
    };

    render() {
        const { showScanner, isLoading } = this.props;

        const input = this.renderInput();

        return (
            <View style={[AppStyles.row]}>
                {input}
                {showScanner && (
                    <TouchableHighlight style={styles.scanButton} onPress={this.showScanner}>
                        <Icon size={25} name="IconScan" style={styles.scanIcon} />
                    </TouchableHighlight>
                )}

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator color={AppColors.blue} style={styles.loadingIndicator} />
                    </View>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default Input;
