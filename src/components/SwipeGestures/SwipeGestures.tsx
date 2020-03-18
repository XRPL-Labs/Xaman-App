/* eslint-disable spellcheck/spell-checker */
// Credit: https: github.com/glepur/react-native-swipe-gestures/blob/master/index.js

import React, { Component } from 'react';
import {
    View,
    PanResponder,
    PanResponderGestureState,
    GestureResponderEvent,
    PanResponderInstance,
    ViewProps,
} from 'react-native';

export enum SwipeDirections {
    SWIPE_UP = 'SWIPE_UP',
    SWIPE_DOWN = 'SWIPE_DOWN',
    SWIPE_LEFT = 'SWIPE_LEFT',
    SWIPE_RIGHT = 'SWIPE_RIGHT',
}

interface GestureRecognizerConfig {
    velocityThreshold?: number;
    directionalOffsetThreshold?: number;
    gestureIsClickThreshold?: number;
}

function isValidSwipe(velocity: any, velocityThreshold: any, directionalOffset: any, directionalOffsetThreshold: any) {
    return Math.abs(velocity) > velocityThreshold && Math.abs(directionalOffset) < directionalOffsetThreshold;
}

export interface Props extends ViewProps {
    onSwipe?(gestureName: string, gestureState: PanResponderGestureState): void;
    onSwipeUp?(gestureState: PanResponderGestureState): void;
    onSwipeDown?(gestureState: PanResponderGestureState): void;
    onSwipeLeft?(gestureState: PanResponderGestureState): void;
    onSwipeRight?(gestureState: PanResponderGestureState): void;
}

class GestureRecognizer extends Component<Props> {
    swipeConfig: GestureRecognizerConfig;
    panResponder: PanResponderInstance;

    constructor(props: Props) {
        super(props);
        this.swipeConfig = {
            velocityThreshold: 0.3,
            directionalOffsetThreshold: 80,
            gestureIsClickThreshold: 5,
        };

        const responderEnd = this.handlePanResponderEnd.bind(this);
        const shouldSetResponder = this.handleShouldSetPanResponder.bind(this);
        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: shouldSetResponder,
            onMoveShouldSetPanResponder: shouldSetResponder,
            onPanResponderRelease: responderEnd,
            onPanResponderTerminate: responderEnd,
        });
    }

    handleShouldSetPanResponder(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
        return evt.nativeEvent.touches.length === 1 && !this.gestureIsClick(gestureState);
    }

    gestureIsClick = (gestureState: PanResponderGestureState) => {
        return (
            Math.abs(gestureState.dx) < this.swipeConfig.gestureIsClickThreshold &&
            Math.abs(gestureState.dy) < this.swipeConfig.gestureIsClickThreshold
        );
    };

    handlePanResponderEnd(evt: GestureResponderEvent, gestureState: PanResponderGestureState) {
        const swipeDirection = this.getSwipeDirection(gestureState);
        this.triggerSwipeHandlers(swipeDirection, gestureState);
    }

    triggerSwipeHandlers(swipeDirection: SwipeDirections, gestureState: PanResponderGestureState) {
        const { onSwipe, onSwipeUp, onSwipeDown, onSwipeLeft, onSwipeRight } = this.props;
        onSwipe && onSwipe(swipeDirection, gestureState);
        switch (swipeDirection) {
            case SwipeDirections.SWIPE_LEFT:
                onSwipeLeft && onSwipeLeft(gestureState);
                break;
            case SwipeDirections.SWIPE_RIGHT:
                onSwipeRight && onSwipeRight(gestureState);
                break;
            case SwipeDirections.SWIPE_UP:
                onSwipeUp && onSwipeUp(gestureState);
                break;
            case SwipeDirections.SWIPE_DOWN:
                onSwipeDown && onSwipeDown(gestureState);
                break;
            default:
                break;
        }
    }

    getSwipeDirection(gestureState: PanResponderGestureState) {
        const { dx, dy } = gestureState;
        if (this.isValidHorizontalSwipe(gestureState)) {
            return dx > 0 ? SwipeDirections.SWIPE_RIGHT : SwipeDirections.SWIPE_LEFT;
            /* eslint-disable-next-line */
        } else if (this.isValidVerticalSwipe(gestureState)) {
            return dy > 0 ? SwipeDirections.SWIPE_DOWN : SwipeDirections.SWIPE_UP;
        }
        return null;
    }

    isValidHorizontalSwipe(gestureState: PanResponderGestureState) {
        const { vx, dy } = gestureState;
        const { velocityThreshold, directionalOffsetThreshold } = this.swipeConfig;
        return isValidSwipe(vx, velocityThreshold, dy, directionalOffsetThreshold);
    }

    isValidVerticalSwipe(gestureState: PanResponderGestureState) {
        const { vy, dx } = gestureState;
        const { velocityThreshold, directionalOffsetThreshold } = this.swipeConfig;
        return isValidSwipe(vy, velocityThreshold, dx, directionalOffsetThreshold);
    }

    render() {
        /* eslint-disable-next-line */
        return <View {...this.props} {...this.panResponder.panHandlers} />;
    }
}

export default GestureRecognizer;
