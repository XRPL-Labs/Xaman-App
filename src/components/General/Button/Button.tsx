/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import isEqual from 'lodash/isEqual';

import { View, TouchableOpacity, Text, ActivityIndicator, TextStyle, ViewStyle, ImageStyle } from 'react-native';

import { Images } from '@common/helpers/images';
import { Icon } from '@components/General/Icon';

import { AppColors } from '@theme';
import styles from './styles';

interface Props {
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    disabledStyle?: TextStyle | TextStyle[];
    iconStyle?: ImageStyle | ImageStyle[];
    secondary?: boolean;
    light?: boolean;
    outline?: boolean;
    clear?: boolean;
    rounded?: boolean;
    roundedSmall?: boolean;
    roundedMini?: boolean;
    block?: boolean;
    accessibilityLabel?: string;
    testID?: string;
    activeOpacity?: number;
    allowFontScaling?: boolean;
    isLoading?: boolean;
    isDisabled?: boolean;
    activityIndicatorColor?: string;
    onPress?: () => void;
    onLongPress?: () => void;
    label?: string;
    icon?: Extract<keyof typeof Images, string>;
    iconPosition?: 'right' | 'left';
    iconSize?: number;
    hitSlop?: any;
}

export default class Button extends Component<Props> {
    static defaultProps = {
        iconPosition: 'left',
        iconSize: 20,
        activeOpacity: 0.6,
        allowFontScaling: false,
    };

    renderChildren() {
        const {
            label,
            icon,
            iconPosition,
            secondary,
            light,
            outline,
            clear,
            rounded,
            roundedSmall,
            roundedMini,
            allowFontScaling,
            textStyle,
            iconStyle,
            iconSize,
            isDisabled,
        } = this.props;

        return (
            <View style={[styles.buttonWrapper]}>
                {icon && iconPosition === 'left' && (
                    <Icon
                        name={icon}
                        size={iconSize}
                        style={[styles.iconLeft, secondary && styles.iconButtonSecondary, iconStyle]}
                    />
                )}
                {label && (
                    <Text
                        style={[
                            styles.textButton,
                            secondary && styles.textButtonSecondary,
                            light && styles.textButtonLight,
                            outline && styles.textButtonOutline,
                            clear && styles.textButtonClear,
                            rounded && styles.textButtonRounded,
                            roundedSmall && styles.textButtonRoundedSmall,
                            roundedMini && styles.textButtonRoundedMini,
                            isDisabled && styles.textButtonDisabled,
                            textStyle,
                        ]}
                        allowFontScaling={allowFontScaling}
                    >
                        {label}
                    </Text>
                )}
                {icon && iconPosition === 'right' && (
                    <Icon
                        name={icon}
                        size={iconSize}
                        style={[styles.iconRight, secondary && styles.iconButtonSecondary, iconStyle]}
                    />
                )}
            </View>
        );
    }

    shouldComponentUpdate(nextProps: Props) {
        return !isEqual(nextProps, this.props);
    }

    renderInnerContent() {
        const { isLoading, activityIndicatorColor } = this.props;
        if (isLoading) {
            return (
                <ActivityIndicator
                    animating
                    size="small"
                    style={styles.spinner}
                    color={activityIndicatorColor || AppColors.white}
                />
            );
        }
        return this.renderChildren();
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
            secondary,
            light,
            outline,
            clear,
            rounded,
            roundedSmall,
            roundedMini,
            block,
            disabledStyle,
            accessibilityLabel,
            activeOpacity,
            testID,
            hitSlop,
        } = this.props;

        if (isDisabled === true) {
            return (
                <View style={[styles.button, disabledStyle || styles.buttonDisabled, style]}>
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
            <TouchableOpacity
                accessibilityRole="button"
                delayPressIn={0}
                style={[
                    styles.button,
                    secondary && styles.buttonSecondary,
                    light && styles.buttonLight,
                    outline && styles.buttonOutline,
                    clear && styles.buttonClear,
                    rounded && styles.buttonRounded,
                    roundedSmall && styles.buttonRoundedSmall,
                    roundedMini && styles.buttonRoundedMini,
                    block && styles.buttonBlock,
                    isDisabled && (disabledStyle || styles.buttonDisabled),
                    style,
                ]}
                onPress={this.onPress}
                onLongPress={this.onLongPress}
                {...touchableProps}
            >
                {this.renderInnerContent()}
            </TouchableOpacity>
        );
    }
}
