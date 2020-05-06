/* eslint-disable react/jsx-props-no-spreading */
import React, { Component } from 'react';
import isEqual from 'lodash/isEqual';

import {
    Animated,
    View,
    Text,
    TouchableWithoutFeedback,
    ActivityIndicator,
    TextStyle,
    ViewStyle,
    ImageStyle,
} from 'react-native';

import { Images } from '@common/helpers/images';

import { Icon } from '@components/Icon';

import { AppColors } from '@theme';
import { styles } from './styles';

interface Props {
    style?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    disabledStyle?: TextStyle | TextStyle[];
    iconStyle?: ImageStyle | ImageStyle[];
    accessibilityLabel?: string;
    testID?: string;
    activeOpacity?: number;
    isDisabled?: boolean;
    isLoading?: boolean;
    activityIndicatorColor?: string;
    onPress?: () => void;
    onLongPress?: () => void;
    label?: string;
    icon?: Extract<keyof typeof Images, string>;
    iconPosition?: 'right' | 'left';
    iconSize?: number;
}

interface State {
    width: number;
}

export default class CustomButton extends Component<Props, State> {
    static defaultProps = {
        iconPosition: 'left',
        iconSize: 20,
    };

    private animatedActive: Animated.Value;
    private animatedValue: Animated.Value;
    private pressing: boolean;

    constructor(props: Props) {
        super(props);
        this.animatedActive = new Animated.Value(props.isDisabled ? 0 : 0.1);
        this.animatedValue = new Animated.Value(0);
        this.pressing = false;
    }

    shouldComponentUpdate(nextProps: Props) {
        return !isEqual(nextProps, this.props);
    }

    getAnimatedValues() {
        return {
            animatedContainer: {
                shadowOpacity: this.animatedActive,
            },
            animatedContent: {
                transform: [
                    {
                        translateY: this.animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1.5],
                        }),
                    },
                ],
            },
        };
    }

    animateTiming = ({ variable, toValue, duration = 200, delay = 0, easing = undefined, callback = null }: any) => {
        Animated.timing(variable, {
            toValue,
            duration,
            easing,
            delay,
            useNativeDriver: true,
        }).start(callback);
    };

    animateSpring = ({ variable, toValue, delay = 0, tension = 100, friction = 6.75, callback = null }: any) => {
        Animated.spring(variable, {
            toValue,
            tension,
            friction,
            delay,
            useNativeDriver: true,
        }).start(callback);
    };

    onPress = () => {
        const { isDisabled, isLoading } = this.props;

        if (isDisabled || isLoading) {
            return;
        }

        this.animateTiming({
            variable: this.animatedValue,
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
        });
        this.animateTiming({
            variable: this.animatedActive,
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
            callback: () => {
                this.press();
                this.release();
            },
        });
    };

    press = () => {
        const { onPress } = this.props;
        if (onPress) {
            onPress();
        }
    };

    release(callback = () => {}) {
        this.animateSpring({
            variable: this.animatedActive,
            toValue: 0.1,
        });
        this.animateSpring({
            variable: this.animatedValue,
            toValue: 0,
            callback,
        });
    }

    renderChildren() {
        const {
            activityIndicatorColor,
            label,
            icon,
            iconPosition,
            textStyle,
            iconStyle,
            iconSize,
            isDisabled,
            isLoading,
        } = this.props;

        if (isLoading) {
            return <ActivityIndicator color={activityIndicatorColor || AppColors.blue} />;
        }
        return (
            /* eslint-disable-next-line */
            <View style={[styles.buttonWrapper, { opacity: isDisabled ? 0.3 : 1 }]}>
                {icon && iconPosition === 'left' && (
                    <Icon name={icon} size={iconSize} style={[styles.iconLeft, iconStyle]} />
                )}
                {label && <Text style={[styles.textButton, textStyle]}>{label}</Text>}
                {icon && iconPosition === 'right' && (
                    <Icon name={icon} size={iconSize} style={[styles.iconRight, iconStyle]} />
                )}
            </View>
        );
    }

    render() {
        const { style, accessibilityLabel, testID } = this.props;

        const animatedValues = this.getAnimatedValues();

        return (
            <TouchableWithoutFeedback testID={testID} onPress={this.onPress} accessibilityLabel={accessibilityLabel}>
                <Animated.View style={[styles.container, animatedValues.animatedContainer]}>
                    <View style={[styles.bottom, style]} />
                    <Animated.View style={[styles.content, animatedValues.animatedContent]}>
                        <View style={[styles.children]}>{this.renderChildren()}</View>
                    </Animated.View>
                </Animated.View>
            </TouchableWithoutFeedback>
        );
    }
}
