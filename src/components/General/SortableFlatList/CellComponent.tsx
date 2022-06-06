import React, { PureComponent } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

import { VibrateHapticFeedback } from '@common/helpers/interface';

import styles from './styles';

/* Constants ==================================================================== */
const LONG_PRESS_DELAY = 400;

/* Types ==================================================================== */
export interface Props {
    testID: string;
    cellHeight: number;
    separatorHeight: number;
    index: number;
    onPress: (index: number) => void;
    onLongPress: (index: number) => void;
    onPressOut: (index: number) => void;
}

/* Component ==================================================================== */
class CellComponent extends PureComponent<Props> {
    private itemRef: React.RefObject<any>;
    private positionAnimation: Animated.ValueXY;
    private scaleAnimation: Animated.Value;
    private originTop: number;
    private currentIndex: number;
    private originIndex: number;

    constructor(props: Props) {
        super(props);

        // reference to the item container view
        this.itemRef = React.createRef();

        // track of the item current index
        this.currentIndex = props.index;
        this.originIndex = props.index;

        // track origin position
        this.originTop = (props.cellHeight + props.separatorHeight) * props.index;

        // animation values
        this.scaleAnimation = new Animated.Value(1);
        this.positionAnimation = new Animated.ValueXY({
            x: 0,
            y: this.originTop,
        });
    }

    isValid = () => {
        return this.itemRef.current != null;
    };

    getCellState = () => {
        return {
            originTop: this.originTop,
            currentIndex: this.currentIndex,
            originIndex: this.originIndex,
        };
    };

    setCurrentIndex = (index: number) => {
        this.currentIndex = index;
    };

    resetState = () => {
        const { index, cellHeight, separatorHeight } = this.props;

        this.currentIndex = index;
        this.originIndex = index;

        // track origin position
        this.originTop = (cellHeight + separatorHeight) * index;

        // animation values
        this.scaleAnimation.setValue(1);
        this.positionAnimation.setValue({
            x: 0,
            y: this.originTop,
        });
    };

    activeCell = (callback?: any) => {
        this.itemRef.current?.setNativeProps({
            style: {
                zIndex: 99,
            },
        });

        Animated.timing(this.scaleAnimation, {
            toValue: 1.1,
            duration: 100,
            useNativeDriver: false,
        }).start(() => {
            // vibrate
            VibrateHapticFeedback('impactMedium');
            // callback
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    deactivateCell = (callback?: any) => {
        // back the item scale to normal
        Animated.timing(this.scaleAnimation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: false,
        }).start(() => {
            this.itemRef.current?.setNativeProps({
                style: {
                    zIndex: 8,
                },
            });

            // vibrate
            VibrateHapticFeedback('impactMedium');

            // manually trigger move to index method to realign item with the new position
            this.moveToIndex(this.currentIndex);

            // callback
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    adjustPosition = () => {
        this.moveToIndex(this.currentIndex);
    };

    movePosition = (dy: number) => {
        // move the element
        this.positionAnimation.setValue({
            x: 0,
            y: this.originTop + dy,
        });
    };

    moveToIndex = (index: number) => {
        const { cellHeight, separatorHeight } = this.props;

        // store new current index
        this.currentIndex = index;
        this.originIndex = index;

        // calculate new origin top
        const newOriginTop = (cellHeight + separatorHeight) * index;

        Animated.timing(this.positionAnimation, {
            toValue: {
                x: 0,
                y: newOriginTop,
            },
            duration: 200,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start(() => {
            this.originTop = newOriginTop;
        });
    };

    onLongPress = () => {
        const { onLongPress } = this.props;

        if (typeof onLongPress === 'function') {
            onLongPress(this.currentIndex);
        }
    };

    onPressOut = () => {
        const { onPressOut } = this.props;

        if (typeof onPressOut === 'function') {
            onPressOut(this.currentIndex);
        }
    };

    onPress = () => {
        const { onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(this.currentIndex);
        }
    };

    render() {
        const { children, testID } = this.props;

        return (
            <Animated.View
                ref={this.itemRef}
                /* eslint-disable-next-line react/jsx-props-no-spreading */
                {...this.props}
                style={[
                    styles.item,
                    {
                        left: this.positionAnimation.x,
                        top: this.positionAnimation.y,
                        opacity: this.scaleAnimation.interpolate({ inputRange: [1, 1.1], outputRange: [1, 0.8] }),
                        transform: [{ scale: this.scaleAnimation }],
                    },
                ]}
            >
                <Pressable
                    testID={testID}
                    delayLongPress={LONG_PRESS_DELAY}
                    onLongPress={this.onLongPress}
                    onPressOut={this.onPressOut}
                    onPress={this.onPress}
                >
                    {children}
                </Pressable>
            </Animated.View>
        );
    }
}

export default CellComponent;
