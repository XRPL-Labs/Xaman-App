import React, { Component } from 'react';
import {
    Text,
    View,
    PanResponder,
    Animated,
    PanResponderGestureState,
    GestureResponderEvent,
    ActivityIndicator,
} from 'react-native';

import { AppSizes, AppColors } from '@theme';

// Components
import { Icon } from '../Icon';

// Styles
import styles from './styles';

const DEFAULT_ANIMATION_DURATION = 400;
const RESET_AFTER_SUCCESS_DEFAULT_DELAY = 1000;
const SWIPE_SUCCESS_THRESHOLD = 80;

/* Types ==================================================================== */
interface Props {
    testID?: string;
    label?: string;
    isLoading?: boolean;
    secondary?: boolean;
    onSwipeSuccess: () => void;
    onPanResponderGrant?: () => void;
    onPanResponderRelease?: () => void;
    shouldResetAfterSuccess?: boolean;
}

interface State {}
/* Component ==================================================================== */
class SwipeButton extends Component<Props, State> {
    static defaultProps = {
        shouldResetAfterSuccess: false,
    };

    private animatedWidth: Animated.Value;
    private defaultContainerWidth: number;
    private maxWidth: number;
    private panResponder: any;

    constructor(props: Props) {
        super(props);

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
        const newWidth = this.defaultContainerWidth + 1 * gestureState.dx;

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
        setTimeout(() => {
            shouldResetAfterSuccess && this.reset();
        }, resetDelay);
    };

    reset = () => {
        this.changePosition(this.defaultContainerWidth);
    };

    render() {
        const { label, isLoading, secondary, testID } = this.props;

        if (isLoading) {
            return (
                <View style={[styles.container]}>
                    <ActivityIndicator animating size="small" style={styles.spinner} color={AppColors.white} />
                </View>
            );
        }

        return (
            <View style={[styles.container, secondary && styles.containerSecondary]} onLayout={this.onLayoutChange}>
                <Text importantForAccessibility="no-hide-descendants" style={[styles.label]}>
                    {label}
                </Text>
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
