/**
 * Action Panel component
 */
import React, { Component } from 'react';
import {
    Animated,
    View,
    TouchableWithoutFeedback,
    InteractionManager,
    PanResponder,
    ViewStyle,
    GestureResponderEvent,
    PanResponderGestureState,
    PanResponderInstance,
} from 'react-native';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
interface Props extends React.PropsWithChildren {
    height: number;
    offset?: number;
    extraBottomInset?: boolean;
    testID?: string;
    contentStyle?: ViewStyle | ViewStyle[];
    onSlideDown?: () => void;
}

interface SnapPoint {
    y: number;
}

interface State {
    snapPoints: SnapPoint[];
    boundaries: { top: number };
    panelHeight?: number;
}

/* Constants ==================================================================== */
const BOUNDARY_HEIGHT = 20;
const HEADER_CAPTURE_HEIGHT = 56;
const MOVE_CAPTURE_THRESHOLD = 10;
const FLICK_VELOCITY = 0.8;

/* Component ==================================================================== */
class ActionPanel extends Component<Props, State> {
    private translateY: Animated.Value;
    private panResponder: PanResponderInstance;
    private currentY: number;
    private dragStartY: number;
    private currentIndex: number;
    private isOpening: boolean;
    private isDragging: boolean;
    private dismissed: boolean;
    private startedOnHeader: boolean;
    private slideTimeout?: ReturnType<typeof setTimeout>;

    constructor(props: Props) {
        super(props);

        const screenHeight = AppSizes.screen.height;

        this.state = {
            snapPoints: [],
            boundaries: { top: 0 },
            panelHeight: undefined,
        };

        this.translateY = new Animated.Value(screenHeight);
        this.currentY = screenHeight;
        this.dragStartY = screenHeight;
        this.currentIndex = 0;
        this.isOpening = true;
        this.isDragging = false;
        this.dismissed = false;
        this.startedOnHeader = false;

        this.translateY.addListener(({ value }) => {
            this.currentY = value;
        });

        this.panResponder = PanResponder.create({
            onStartShouldSetPanResponder: this.onStartShouldSetPanResponder,
            onMoveShouldSetPanResponder: this.onMoveShouldSetPanResponder,
            onPanResponderGrant: this.onPanResponderGrant,
            onPanResponderMove: this.onPanResponderMove,
            onPanResponderRelease: this.onPanResponderRelease,
            onPanResponderTerminate: this.onPanResponderRelease,
            onPanResponderTerminationRequest: this.onPanResponderTerminationRequest,
            onShouldBlockNativeResponder: () => false,
        });
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.slideUp);
    }

    componentWillUnmount() {
        if (this.slideTimeout) {
            clearTimeout(this.slideTimeout);
        }

        this.translateY.removeAllListeners();
        this.translateY.stopAnimation();
    }

    static getDerivedStateFromProps(props: Props) {
        const { height, offset, extraBottomInset } = props;

        const { height: screenHeight } = AppSizes.screen;

        let panelHeight = height;

        if (extraBottomInset) {
            panelHeight += AppSizes.safeAreaBottomInset;
        }

        const snapPoints = [{ y: screenHeight }, { y: screenHeight - panelHeight }];

        let topBoundary = AppSizes.screen.height - (panelHeight + BOUNDARY_HEIGHT);

        if (typeof offset === 'number') {
            topBoundary -= offset;
            snapPoints.push({
                y: AppSizes.screen.height - panelHeight - offset,
            });
        }

        return {
            panelHeight: panelHeight + BOUNDARY_HEIGHT,
            snapPoints,
            boundaries: {
                top: topBoundary,
            },
        };
    }

    public slideUp = () => {
        this.snapTo(1);
    };

    public slideDown = () => {
        this.snapTo(0);
    };

    public snapTo = (index: number) => {
        if (this.slideTimeout) {
            clearTimeout(this.slideTimeout);
        }

        this.slideTimeout = setTimeout(() => {
            this.animateToIndex(index);
        }, 50);
    };

    private onStartShouldSetPanResponder = (event: GestureResponderEvent) => {
        this.startedOnHeader = event.nativeEvent.locationY <= HEADER_CAPTURE_HEIGHT;
        return this.startedOnHeader;
    };

    private onMoveShouldSetPanResponder = (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        // Do not steal vertical pans from nested ScrollViews.
        if (!this.startedOnHeader) {
            return false;
        }

        const { dy, dx } = gestureState;

        return Math.abs(dy) > MOVE_CAPTURE_THRESHOLD && Math.abs(dy) > Math.abs(dx);
    };

    private onPanResponderTerminationRequest = () => !this.startedOnHeader;

    private onPanResponderGrant = () => {
        this.translateY.stopAnimation();
        this.dragStartY = this.currentY;
        this.isDragging = true;
    };

    private onPanResponderMove = (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const { boundaries } = this.state;
        const maxY = AppSizes.screen.height;

        let nextY = this.dragStartY + gestureState.dy;

        if (nextY < boundaries.top) {
            nextY = boundaries.top;
        }

        if (nextY > maxY) {
            nextY = maxY;
        }

        this.translateY.setValue(nextY);
    };

    private onPanResponderRelease = (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        this.isDragging = false;
        this.startedOnHeader = false;
        this.animateToIndex(this.getTargetIndex(this.currentY, gestureState.vy));
    };

    private getTargetIndex = (y: number, vy: number) => {
        const { snapPoints } = this.state;

        if (!snapPoints.length) {
            return 0;
        }

        const lastIndex = snapPoints.length - 1;

        if (vy > FLICK_VELOCITY) {
            return Math.max(0, this.currentIndex - 1);
        }

        if (vy < -FLICK_VELOCITY) {
            return Math.min(lastIndex, this.currentIndex + 1);
        }

        let nearest = 0;
        let bestDistance = Number.POSITIVE_INFINITY;

        snapPoints.forEach((point, index) => {
            const distance = Math.abs(point.y - y);

            if (distance < bestDistance) {
                bestDistance = distance;
                nearest = index;
            }
        });

        return nearest;
    };

    private animateToIndex = (index: number) => {
        const { snapPoints } = this.state;
        const point = snapPoints[index];

        if (!point) {
            return;
        }

        this.currentIndex = index;

        Animated.spring(this.translateY, {
            toValue: point.y,
            useNativeDriver: true,
            friction: 9,
            tension: 70,
            overshootClamping: true,
        }).start(({ finished }) => {
            if (!finished || this.isDragging) {
                return;
            }

            if (this.isOpening && index > 0) {
                this.isOpening = false;
            }

            if (index === 0 && !this.isOpening) {
                this.notifyDismissed();
            }
        });
    };

    private notifyDismissed = () => {
        const { onSlideDown } = this.props;

        if (this.dismissed) {
            return;
        }

        this.dismissed = true;

        if (typeof onSlideDown === 'function') {
            onSlideDown();
        }
    };

    render() {
        const { children, testID, contentStyle } = this.props;
        const { panelHeight } = this.state;

        if (!panelHeight) return null;

        return (
            <View testID={testID} style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
                    <Animated.View
                        style={[
                            styles.shadowContent,
                            {
                                opacity: this.translateY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [0.8, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Animated.View
                    style={[
                        styles.panel,
                        {
                            transform: [{ translateY: this.translateY }],
                        },
                    ]}
                >
                    <View style={[styles.container, { height: panelHeight + BOUNDARY_HEIGHT }, contentStyle]}>
                        <View style={styles.panelHeader} {...this.panResponder.panHandlers}>
                            <View style={styles.panelHandle} />
                        </View>
                        {children}
                    </View>
                </Animated.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ActionPanel;
