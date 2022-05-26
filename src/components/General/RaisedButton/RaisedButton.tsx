import React, { Component } from 'react';
import { debounce, isEqual } from 'lodash';

import {
    Animated,
    View,
    Text,
    TouchableWithoutFeedback,
    TextStyle,
    ViewStyle,
    ImageStyle,
    Platform,
} from 'react-native';

import { Images } from '@common/helpers/images';

import { Icon } from '@components/General/Icon';
import { LoadingIndicator } from '@components/General/LoadingIndicator';

import { AppSizes } from '@theme';

import { styles } from './styles';

/* Types ==================================================================== */
interface Props {
    small?: boolean;
    containerStyle?: ViewStyle | ViewStyle[];
    textStyle?: TextStyle | TextStyle[];
    disabledStyle?: TextStyle | TextStyle[];
    iconStyle?: ImageStyle | ImageStyle[];
    accessibilityLabel?: string;
    testID?: string;
    isDisabled?: boolean;
    isLoading?: boolean;
    loadingIndicatorStyle?: 'light' | 'dark';
    onPress?: () => void;
    onLongPress?: () => void;
    label?: string;
    icon?: Extract<keyof typeof Images, string>;
    iconPosition?: 'right' | 'left';
    iconSize?: number;
}

interface State {
    isDisabled: boolean;
    animatedShadow: Animated.Value;
    animatedScale: Animated.Value;
}

/* Component ==================================================================== */
export default class RaisedButton extends Component<Props, State> {
    static defaultProps = {
        small: false,
        iconPosition: 'left',
        iconSize: 20,
        isDisabled: false,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            isDisabled: props.isDisabled,
            animatedShadow: new Animated.Value(props.isDisabled ? 0 : Platform.select({ ios: 0.1, android: 5 })),
            animatedScale: new Animated.Value(0),
        };
    }

    shouldComponentUpdate(nextProps: Props) {
        return !isEqual(nextProps, this.props);
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
        if (nextProps.isDisabled !== prevState.isDisabled) {
            return {
                animatedShadow: new Animated.Value(
                    nextProps.isDisabled ? 0 : Platform.select({ ios: 0.1, android: 5 }),
                ),
                isDisabled: nextProps.isDisabled,
            };
        }

        return null;
    }

    getContentHeight = () => {
        const { small } = this.props;

        if (small) {
            return AppSizes.scale(40);
        }

        return AppSizes.scale(50);
    };

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

    debouncedOnPress = () => {
        const { animatedShadow, animatedScale } = this.state;
        const { isDisabled, isLoading } = this.props;

        if (isDisabled || isLoading) {
            return;
        }

        this.animateTiming({
            variable: animatedScale,
            toValue: 1,
            duration: 50,
            useNativeDriver: true,
        });
        this.animateTiming({
            variable: animatedShadow,
            toValue: 0,
            duration: 50,
            useNativeDriver: true,
            callback: () => {
                this.press();
                this.release();
            },
        });
    };

    onPress = debounce(this.debouncedOnPress, 500, { leading: true, trailing: false });

    press = () => {
        const { onPress } = this.props;
        if (onPress) {
            onPress();
        }
    };

    release(callback = () => {}) {
        const { animatedShadow, animatedScale } = this.state;

        this.animateSpring({
            variable: animatedShadow,
            toValue: Platform.select({ ios: 0.1, android: 3 }),
        });
        this.animateSpring({
            variable: animatedScale,
            toValue: 0,
            callback,
        });
    }

    renderChildren() {
        const {
            label,
            icon,
            iconPosition,
            textStyle,
            iconStyle,
            iconSize,
            isDisabled,
            isLoading,
            loadingIndicatorStyle,
        } = this.props;

        if (isLoading) {
            return <LoadingIndicator color={loadingIndicatorStyle} />;
        }

        return (
            /* eslint-disable-next-line */
            <View style={[styles.buttonWrapper, { opacity: isDisabled ? 0.3 : 1 }]}>
                {icon && iconPosition === 'left' && (
                    <Icon name={icon} size={iconSize} style={[styles.iconLeft, iconStyle]} />
                )}
                {label && (
                    <Text numberOfLines={1} style={[styles.textButton, textStyle]}>
                        {label}
                    </Text>
                )}
                {icon && iconPosition === 'right' && (
                    <Icon name={icon} size={iconSize} style={[styles.iconRight, iconStyle]} />
                )}
            </View>
        );
    }

    render() {
        const { containerStyle, accessibilityLabel, testID } = this.props;
        const { animatedShadow, animatedScale } = this.state;

        const contentHeight = this.getContentHeight();

        return (
            <TouchableWithoutFeedback testID={testID} onPress={this.onPress} accessibilityLabel={accessibilityLabel}>
                <Animated.View
                    style={[
                        styles.container,
                        { height: contentHeight },
                        containerStyle,
                        {
                            shadowOpacity: animatedShadow,
                            elevation: animatedShadow,
                            transform: [
                                {
                                    translateY: animatedScale.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 1.5],
                                    }),
                                },
                            ],
                        },
                    ]}
                >
                    {this.renderChildren()}
                </Animated.View>
            </TouchableWithoutFeedback>
        );
    }
}
