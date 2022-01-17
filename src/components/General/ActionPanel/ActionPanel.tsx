/**
 * Action Panel component
 */
import React, { Component } from 'react';
import { Animated, View, TouchableWithoutFeedback, InteractionManager, ViewStyle } from 'react-native';

import Interactable from 'react-native-interactable';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
interface Props {
    height: number;
    offset?: number;
    extraBottomInset?: boolean;
    testID?: string;
    contentStyle?: ViewStyle | ViewStyle[];
    onSlideDown?: () => void;
}

interface State {
    snapPoints: any;
    boundaries: any;
    alertAreas: any;
    panelHeight: number;
}

/* Constants ==================================================================== */
const BOUNDARY_HEIGHT = 20;

/* Component ==================================================================== */
class ActionPanel extends Component<Props, State> {
    panel: any;
    deltaY: Animated.Value;
    deltaX: Animated.Value;
    isOpening: boolean;

    static defaultProps = {
        showHandler: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            snapPoints: undefined,
            boundaries: undefined,
            alertAreas: undefined,
            panelHeight: undefined,
        };

        this.deltaY = new Animated.Value(AppSizes.screen.height);
        this.deltaX = new Animated.Value(0);

        this.isOpening = true;
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.slideUp);
    }

    static getDerivedStateFromProps(props: Props) {
        const { height, offset, extraBottomInset } = props;

        const { height: screenHeight } = AppSizes.screen;

        let panelHeight = height;

        if (extraBottomInset) {
            panelHeight += AppSizes.bottomStableInset;
        }

        const snapPoints = [{ y: screenHeight }, { y: screenHeight - panelHeight }];

        const alertAreas = [
            { id: 'bottom', influenceArea: { bottom: screenHeight } },
            {
                id: 'top',
                influenceArea: { top: screenHeight - panelHeight },
            },
        ];

        let topBoundary = AppSizes.screen.height - (panelHeight + BOUNDARY_HEIGHT);

        if (typeof offset === 'number') {
            topBoundary -= offset;
            snapPoints.push({
                y: AppSizes.screen.height - panelHeight - offset,
            });
        }

        const boundaries = {
            top: topBoundary,
        };

        return {
            panelHeight: panelHeight + BOUNDARY_HEIGHT,
            snapPoints,
            boundaries,
            alertAreas,
        };
    }

    public slideUp = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 1 });
            }
        }, 50);
    };

    public slideDown = () => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index: 0 });
            }
        }, 50);
    };

    public snapTo = (index: number) => {
        setTimeout(() => {
            if (this.panel) {
                this.panel.snapTo({ index });
            }
        }, 50);
    };

    onAlert = (event: any) => {
        const { onSlideDown } = this.props;

        const { top, bottom } = event.nativeEvent;

        if (top && bottom) return;

        if (top === 'enter' && this.isOpening) {
            this.isOpening = false;
        }

        if (bottom === 'leave' && !this.isOpening) {
            if (typeof onSlideDown === 'function') {
                onSlideDown();
            }
        }
    };

    render() {
        const { children, testID, contentStyle } = this.props;
        const { alertAreas, snapPoints, boundaries, panelHeight } = this.state;

        if (!panelHeight) return null;

        return (
            <View testID={testID} style={AppStyles.flex1}>
                <TouchableWithoutFeedback onPress={this.slideDown}>
                    <Animated.View
                        style={[
                            styles.shadowContent,
                            {
                                opacity: this.deltaY.interpolate({
                                    inputRange: [0, AppSizes.screen.height],
                                    outputRange: [0.8, 0],
                                    extrapolateRight: 'clamp',
                                }),
                            },
                        ]}
                    />
                </TouchableWithoutFeedback>

                <Interactable.View
                    ref={(r) => {
                        this.panel = r;
                    }}
                    animatedNativeDriver
                    onAlert={this.onAlert}
                    verticalOnly
                    snapPoints={snapPoints}
                    boundaries={boundaries}
                    alertAreas={alertAreas}
                    initialPosition={{ y: AppSizes.screen.height }}
                    animatedValueY={this.deltaY}
                    animatedValueX={this.deltaX}
                >
                    <View style={[styles.container, { height: panelHeight + BOUNDARY_HEIGHT }, contentStyle]}>
                        <View style={styles.panelHeader}>
                            <View style={styles.panelHandle} />
                        </View>

                        {children}
                    </View>
                </Interactable.View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ActionPanel;
