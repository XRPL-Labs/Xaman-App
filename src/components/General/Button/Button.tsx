/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import { isEqual } from 'lodash';

import { View, Text, TextStyle, ViewStyle, ImageStyle } from 'react-native';

import { Images } from '@common/helpers/images';
import { TouchableDebounce, Icon, LoadingIndicator } from '@components/General';

import styles from './styles';

interface Props {
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    disabledStyle?: TextStyle | TextStyle[];
    iconStyle?: ImageStyle | ImageStyle[];
    secondary?: boolean;
    light?: boolean;
    contrast?: boolean;
    outline?: boolean;
    clear?: boolean;
    rounded?: boolean;
    roundedSmall?: boolean;
    roundedSmallBlock?: boolean;
    accessibilityLabel?: string;
    testID?: string;
    activeOpacity?: number;
    allowFontScaling?: boolean;
    adjustsFontSizeToFit?: boolean;
    numberOfLines?: number;
    isLoading?: boolean;
    isDisabled?: boolean;
    loadingIndicatorStyle?: 'light' | 'dark';
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
        adjustsFontSizeToFit: false,
        numberOfLines: 2,
    };

    renderChildren() {
        const {
            label,
            icon,
            iconPosition,
            secondary,
            light,
            contrast,
            rounded,
            roundedSmall,
            roundedSmallBlock,
            allowFontScaling,
            adjustsFontSizeToFit,
            numberOfLines,
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
                        style={[
                            styles.iconLeft,
                            light && styles.iconButtonLight,
                            contrast && styles.iconButtonContrast,
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
                            rounded && styles.textButtonRounded,
                            roundedSmall && styles.textButtonRoundedSmall,
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
                            light && styles.iconButtonLight,
                            contrast && styles.iconButtonContrast,
                            iconStyle,
                        ]}
                    />
                )}
            </View>
        );
    }

    shouldComponentUpdate(nextProps: Props) {
        return !isEqual(nextProps, this.props);
    }

    renderInnerContent() {
        const { isLoading, light, loadingIndicatorStyle } = this.props;

        if (isLoading) {
            return (
                <LoadingIndicator
                    size="small"
                    style={styles.spinner}
                    color={loadingIndicatorStyle || light ? 'default' : 'light'}
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
            contrast,
            rounded,
            roundedSmall,
            roundedSmallBlock,
            disabledStyle,
            accessibilityLabel,
            activeOpacity,
            testID,
            hitSlop,
        } = this.props;

        if (isDisabled === true) {
            return (
                <View
                    testID={testID}
                    style={[
                        styles.button,
                        secondary && styles.buttonSecondary,
                        light && styles.buttonLight,
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
                    secondary && styles.buttonSecondary,
                    light && styles.buttonLight,
                    contrast && styles.buttonContrast,
                    rounded && styles.buttonRounded,
                    roundedSmall && styles.buttonRoundedSmall,
                    roundedSmallBlock && styles.buttonRoundedSmallBlock,
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
