/* eslint-disable react/jsx-props-no-spreading */
import React, { Component, PropsWithChildren } from 'react';
import { isEqual } from 'lodash';

import { View, Text, TextStyle, ViewStyle, ImageStyle, StyleProp } from 'react-native';

import { Images } from '@common/helpers/images';

import { TouchableDebounce } from '@components/General/TouchableDebounce';
import { LoadingIndicator } from '@components/General/LoadingIndicator';
import { Icon } from '@components/General/Icon';

import styles from './styles';

/* Types ==================================================================== */
interface Props extends PropsWithChildren {
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabledStyle?: StyleProp<TextStyle>;
    iconStyle?: StyleProp<ImageStyle>;
    transparent?: boolean;
    secondary?: boolean;
    light?: boolean;
    contrast?: boolean;
    rounded?: boolean;
    nonBlock?: boolean;
    roundedSmall?: boolean;
    roundedMini?: boolean;
    roundedSmallBlock?: boolean;
    accessibilityLabel?: string;
    testID?: string;
    activeOpacity?: number;
    allowFontScaling?: boolean;
    adjustsFontSizeToFit?: boolean;
    numberOfLines?: number;
    isLoading?: boolean;
    isDisabled?: boolean;
    loadingIndicatorStyle?: 'light' | 'dark' | 'default';
    onPress?: () => void;
    onLongPress?: () => void;
    label?: string;
    icon?: Extract<keyof typeof Images, string>;
    iconPosition?: 'right' | 'left';
    iconSize?: number;
    hitSlop?: any;
}

/* Component ==================================================================== */
export default class Button extends Component<Props> {
    declare readonly props: Props & Required<Pick<Props, keyof typeof Button.defaultProps>>;

    static defaultProps: Partial<Props> = {
        iconPosition: 'left',
        iconSize: 20,
        activeOpacity: 0.6,
        allowFontScaling: false,
        adjustsFontSizeToFit: false,
        numberOfLines: 2,
    };

    shouldComponentUpdate(nextProps: Props) {
        return !isEqual(nextProps, this.props);
    }

    renderInnerContent() {
        const {
            children,
            isLoading,
            label,
            icon,
            iconPosition,
            secondary,
            light,
            contrast,
            rounded,
            nonBlock,
            roundedSmall,
            roundedSmallBlock,
            roundedMini,
            allowFontScaling,
            adjustsFontSizeToFit,
            numberOfLines,
            textStyle,
            iconStyle,
            iconSize,
            isDisabled,
            loadingIndicatorStyle,
        } = this.props;

        // loading indicator
        if (isLoading) {
            return (
                <LoadingIndicator
                    size="small"
                    style={styles.spinner}
                    color={loadingIndicatorStyle ?? (light ? 'default' : 'light')}
                />
            );
        }

        // if children provided
        if (children) {
            return children;
        }

        return (
            <View style={styles.buttonWrapper}>
                {icon && iconPosition === 'left' && (
                    <Icon
                        name={icon}
                        size={iconSize}
                        style={[
                            styles.iconLeft,
                            light ? styles.iconButtonLight : {},
                            contrast ? styles.iconButtonContrast : {},
                            iconStyle,
                        ]}
                    />
                )}
                {label && (
                    <Text
                        style={[
                            styles.textButton,
                            secondary && styles.textButtonSecondary,
                            light && styles.textButtonLight,
                            contrast && styles.textButtonContrast,
                            nonBlock && styles.textButtonNonBlock,
                            rounded && styles.textButtonRounded,
                            roundedSmall && styles.textButtonRoundedSmall,
                            roundedMini && styles.textButtonRoundedMini,
                            roundedSmallBlock && styles.textButtonRoundedSmallBlock,
                            isDisabled && styles.textButtonDisabled,
                            textStyle,
                        ]}
                        numberOfLines={numberOfLines}
                        allowFontScaling={allowFontScaling}
                        adjustsFontSizeToFit={adjustsFontSizeToFit}
                    >
                        {label}
                    </Text>
                )}
                {icon && iconPosition === 'right' && (
                    <Icon
                        name={icon}
                        size={iconSize}
                        style={[
                            styles.iconRight,
                            light ? styles.iconButtonLight : {},
                            contrast ? styles.iconButtonContrast : {},
                            iconStyle,
                        ]}
                    />
                )}
            </View>
        );
    }

    onPress = () => {
        const { onPress, isLoading } = this.props;

        if (!isLoading && typeof onPress === 'function') {
            onPress();
        }
    };

    onLongPress = () => {
        const { onLongPress, isLoading } = this.props;

        if (!isLoading && typeof onLongPress === 'function') {
            onLongPress();
        }
    };

    render() {
        const {
            isDisabled,
            style,
            transparent,
            secondary,
            light,
            contrast,
            rounded,
            nonBlock,
            roundedSmall,
            roundedSmallBlock,
            roundedMini,
            disabledStyle,
            accessibilityLabel,
            activeOpacity,
            testID,
            hitSlop,
        } = this.props;

        if (isDisabled) {
            return (
                <View
                    testID={testID}
                    style={[
                        styles.button,
                        transparent && styles.buttonTransparent,
                        secondary && styles.buttonSecondary,
                        light && styles.buttonLight,
                        contrast && styles.buttonContrast,
                        nonBlock && styles.buttonNonBlock,
                        rounded && styles.buttonRounded,
                        roundedSmall && styles.buttonRoundedSmall,
                        roundedSmallBlock && styles.buttonRoundedSmallBlock,
                        roundedMini && styles.buttonRoundedMini,
                        disabledStyle || styles.buttonDisabled,
                        style,
                    ]}
                >
                    {this.renderInnerContent()}
                </View>
            );
        }

        // Extract Touchable props
        const touchableProps = {
            testID,
            accessibilityLabel,
            activeOpacity,
            hitSlop,
        };

        return (
            <TouchableDebounce
                accessibilityRole="button"
                delayPressIn={0}
                style={[
                    styles.button,
                    transparent && styles.buttonTransparent,
                    secondary && styles.buttonSecondary,
                    light && styles.buttonLight,
                    contrast && styles.buttonContrast,
                    rounded && styles.buttonRounded,
                    nonBlock && styles.buttonNonBlock,
                    roundedSmall && styles.buttonRoundedSmall,
                    roundedSmallBlock && styles.buttonRoundedSmallBlock,
                    roundedMini && styles.buttonRoundedMini,
                    isDisabled && (disabledStyle || styles.buttonDisabled),
                    style,
                ]}
                onPress={this.onPress}
                onLongPress={this.onLongPress}
                disabled={isDisabled}
                {...touchableProps}
            >
                {this.renderInnerContent()}
            </TouchableDebounce>
        );
    }
}
