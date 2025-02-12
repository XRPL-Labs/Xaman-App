/* eslint-disable react/jsx-props-no-spreading */
/**
 * TextInput
 *
    <TextInput />
 *
 */
import React, { Component } from 'react';
import { View, TextInput, TextInputProps, ViewStyle, TextStyle, Platform } from 'react-native';

import { StringType } from 'xumm-string-decode';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import StyleService from '@services/StyleService';

import { TouchableDebounce } from '@components/General/TouchableDebounce';
import { Icon } from '@components/General/Icon';
import { LoadingIndicator } from '@components/General/LoadingIndicator';

import { Props as ScanModalProps } from '@screens/Modal/Scan/types';

import { AppStyles, AppSizes } from '@theme';
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
    multiline?: boolean;
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
    private instanceRef: React.RefObject<TextInput>;

    constructor(props: Props) {
        super(props);

        this.state = {
            focused: false,
        };

        this.instanceRef = React.createRef();
    }

    public focus = () => {
        setTimeout(() => {
            this.instanceRef?.current?.focus();
        }, 100);
    };

    public blur = () => {
        setTimeout(() => {
            this.instanceRef?.current?.blur();
        }, 100);
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
            multiline,
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
                // noinspection JSConstantReassignment
                delete filteredProps.keyboardType;
            }
        }

        return (
            <View style={[
                styles.wrapper,
                containerStyle,
                focused && activeContainerStyle,
                multiline ? styles.multiline : styles.nonMultiline,
            ]}>
                <TextInput
                    ref={this.instanceRef}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    placeholderTextColor={StyleService.value('$textSecondary')}
                    autoCapitalize={autoCapitalize || 'none'}
                    autoCorrect={false}
                    multiline={!!multiline}
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

        Navigator.showModal<ScanModalProps>(AppScreens.Modal.Scan, {
            type: scannerType,
            onRead: onScannerRead,
            onClose: onScannerClose,
            fallback: scannerFallback,
        });
    };

    render() {
        const { showScanner, isLoading } = this.props;

        const input = this.renderInput();

        return (
            <View style={[AppStyles.row]}>
                {input}
                {showScanner && (
                    <TouchableDebounce activeOpacity={0.8} style={styles.scanButton} onPress={this.showScanner}>
                        <Icon size={25} name="IconScan" style={styles.scanIcon} />
                    </TouchableDebounce>
                )}

                {isLoading && (
                    <View style={styles.loadingOverlay}>
                        <LoadingIndicator style={styles.loadingIndicator} />
                    </View>
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default Input;
