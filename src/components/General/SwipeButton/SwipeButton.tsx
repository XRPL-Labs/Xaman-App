import React, { Component } from 'react';
import {
    Text,
    View,
    PanResponder,
    Animated,
    TouchableOpacity,
    AccessibilityInfo,
    PanResponderGestureState,
    GestureResponderEvent,
    ViewStyle,
} from 'react-native';

import { LoadingIndicator } from '@components/General/LoadingIndicator';

import { AppSizes } from '@theme';

// Components
import { Icon } from '../Icon';

// Styles
import styles from './styles';

/* Constants ==================================================================== */
const DEFAULT_ANIMATION_DURATION = 400;
const RESET_AFTER_SUCCESS_DEFAULT_DELAY = 1000;
const SWIPE_SUCCESS_THRESHOLD = 80;

/* Types ==================================================================== */
interface Props {
    testID?: string;
    label?: string;
    accessibilityLabel?: string;
    isLoading?: boolean;
    secondary?: boolean;
    onSwipeSuccess: () => void;
    onPanResponderGrant?: () => void;
    onPanResponderRelease?: () => void;
    shouldResetAfterSuccess?: boolean;
    style?: ViewStyle | ViewStyle[];
    color?: string;
}

interface State {
    screenReaderEnabled: boolean;
}
/* Component ==================================================================== */
class SwipeButton extends Component<Props, State> {
    static defaultProps = {
        shouldResetAfterSuccess: false,
    };

    private animatedWidth: Animated.Value;
    private defaultContainerWidth: number;
    private maxWidth: number;
    private panResponder: any;
    private resetDelayTimeout: any;

    constructor(props: Props) {
        super(props);

        this.state = {
            screenReaderEnabled: false,
        };

        this.defaultContainerWidth = AppSizes.scale(45);
        this.maxWidth = 0;
        this.animatedWidth = new Animated.Value(this.defaultContainerWidth);

        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponderCapture: () => true,
            onShouldBlockNativeResponder: () => false,
            onPanResponderMove: this.onPanResponderMove,
            onPanResponderRelease: this.onPanResponderRelease,
            onPanResponderGrant: this.onPanResponderGrant,
        });
    }

    componentDidMount() {
        AccessibilityInfo.addEventListener('change', this.onScreenReaderChange);

        AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
            this.setState({
                screenReaderEnabled: enabled,
            });
        });
    }

    componentWillUnmount() {
        if (this.resetDelayTimeout) clearTimeout(this.resetDelayTimeout);
    }

    onScreenReaderChange = (enabled: boolean) => {
        const { screenReaderEnabled } = this.state;

        if (enabled !== screenReaderEnabled) {
            this.setState({
                screenReaderEnabled: enabled,
            });
        }
    };

    onLayoutChange = (e: any) => {
        const { width } = e.nativeEvent.layout;

        this.maxWidth = width - 10;
    };

    changePosition = (width: number) => {
        Animated.timing(this.animatedWidth, {
            toValue: width,
            duration: 400,
            useNativeDriver: false,
        }).start();
    };

    onSwipeNotMetSuccessThreshold = () => {
        // Animate to initial position
        this.changePosition(this.defaultContainerWidth);
    };

    onSwipeMetSuccessThreshold = (newWidth: number) => {
        const { onSwipeSuccess } = this.props;

        if (newWidth !== this.maxWidth) {
            this.finishRemainingSwipe();
            return;
        }

        if (typeof onSwipeSuccess === 'function') {
            onSwipeSuccess();
        }
        this.reset();
    };

    onPanResponderGrant = () => {
        const { onPanResponderGrant } = this.props;

        if (typeof onPanResponderGrant === 'function') {
            onPanResponderGrant();
        }
    };

    onPanResponderMove = (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const newWidth = this.defaultContainerWidth + gestureState.dx;

        if (newWidth < this.defaultContainerWidth) {
            // Reached starting position
            this.reset();
        } else if (newWidth > this.maxWidth) {
            // Reached end position
            this.changePosition(this.maxWidth);
        } else {
            Animated.timing(this.animatedWidth, {
                toValue: newWidth,
                duration: 0,
                useNativeDriver: false,
            }).start();
        }
    };

    onPanResponderRelease = (event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { onPanResponderRelease } = this.props;

        if (typeof onPanResponderRelease === 'function') {
            onPanResponderRelease();
        }

        const newWidth = this.defaultContainerWidth + 1 * gestureState.dx;
        const successThresholdWidth = this.maxWidth * (SWIPE_SUCCESS_THRESHOLD / 100);

        if (newWidth < successThresholdWidth) {
            this.onSwipeNotMetSuccessThreshold();
        } else {
            this.onSwipeMetSuccessThreshold(newWidth);
        }
    };

    finishRemainingSwipe = () => {
        const { onSwipeSuccess, shouldResetAfterSuccess } = this.props;

        // Animate to final position
        this.changePosition(this.maxWidth);

        if (typeof onSwipeSuccess === 'function') {
            onSwipeSuccess();
        }

        // Animate back to initial position after successfully swiped
        const resetDelay = DEFAULT_ANIMATION_DURATION + RESET_AFTER_SUCCESS_DEFAULT_DELAY;
        this.resetDelayTimeout = setTimeout(() => {
            shouldResetAfterSuccess && this.reset();
        }, resetDelay);
    };

    reset = () => {
        this.changePosition(this.defaultContainerWidth);
    };

    render() {
        const { screenReaderEnabled } = this.state;
        const { label, accessibilityLabel, isLoading, secondary, testID, style, color, onSwipeSuccess } = this.props;

        if (isLoading) {
            return (
                <View
                    style={[
                        styles.container,
                        secondary && styles.containerSecondary,
                        style,
                        color && { backgroundColor: color, borderColor: color },
                    ]}
                >
                    <LoadingIndicator style={styles.spinner} color="light" />
                </View>
            );
        }

        if (screenReaderEnabled) {
            return (
                <TouchableOpacity
                    accessible
                    accessibilityRole="button"
                    onPress={onSwipeSuccess}
                    style={[
                        styles.container,
                        secondary && styles.containerSecondary,
                        style,
                        color && { backgroundColor: color, borderColor: color },
                    ]}
                >
                    {/* eslint-disable-next-line react-native/no-inline-styles */}
                    <Text style={[styles.label, { paddingLeft: 0 }]}>{accessibilityLabel}</Text>
                </TouchableOpacity>
            );
        }

        return (
            <View
                style={[
                    styles.container,
                    secondary && styles.containerSecondary,
                    style,
                    color && { backgroundColor: color, borderColor: color },
                ]}
                onLayout={this.onLayoutChange}
            >
                <Text style={[styles.label]}>{label}</Text>
                <Animated.View
                    testID={testID}
                    style={[styles.thumpContainer, { width: this.animatedWidth }]}
                    // eslint-disable-next-line react/jsx-props-no-spreading
                    {...this.panResponder.panHandlers}
                >
                    <View style={[styles.iconContainer, secondary && styles.iconContainerSecondary]}>
                        <Icon size={30} name="IconArrowRightLong" />
                    </View>
                </Animated.View>
            </View>
        );
    }
}

export default SwipeButton;
