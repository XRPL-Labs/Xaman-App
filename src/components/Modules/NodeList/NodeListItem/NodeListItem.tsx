import React, { Component } from 'react';
import { View, Text, Animated } from 'react-native';

import Interactable from 'react-native-interactable';

import { TouchableDebounce, Icon } from '@components/General';

import { AppStyles, AppSizes } from '@theme';

import styles from './styles';
/* Component ==================================================================== */

/* types ==================================================================== */
export interface Props {
    item: any;
    selected?: boolean;
    canRemove?: boolean;
    onPress?: (item: any) => void;
    onRemovePress?: (item: any) => void;
}

export interface State {}

/* component ==================================================================== */
class NodeListItem extends Component<Props, State> {
    private deltaY: Animated.Value;
    private deltaX: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.deltaY = new Animated.Value(AppSizes.screen.width);
        this.deltaX = new Animated.Value(0);
    }

    onPress = () => {
        const { item, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(item);
        }
    };

    onRemovePress = () => {
        const { item, onRemovePress } = this.props;

        if (typeof onRemovePress === 'function') {
            onRemovePress(item);
        }
    };

    render() {
        const { selected, item, canRemove } = this.props;

        return (
            <View>
                <View style={styles.removeContainer} pointerEvents="box-none">
                    <Animated.View
                        style={[
                            styles.removeHolder,
                            {
                                transform: [
                                    {
                                        translateX: this.deltaX.interpolate({
                                            inputRange: [-155, 0],
                                            outputRange: [0, 155],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <TouchableDebounce onPress={this.onRemovePress}>
                            <Icon name="IconTrash" size={28} style={AppStyles.imgColorWhite} />
                        </TouchableDebounce>
                    </Animated.View>
                </View>

                <Interactable.View
                    dragEnabled={canRemove}
                    horizontalOnly
                    snapPoints={[
                        { x: 78, damping: 1 - 1 - 0.7, tension: 150 },
                        { x: 0, damping: 1 - 1 - 0.7, tension: 150 },
                        { x: -AppSizes.screen.width * 0.25, damping: 1 - 1 - 0.7, tension: 150 },
                    ]}
                    boundaries={{ left: -AppSizes.screen.width * 0.3, right: 0, bounce: 0 }}
                    animatedValueX={this.deltaX}
                    animatedValueY={this.deltaY}
                >
                    <TouchableDebounce activeOpacity={0.8} testID={`node-${item.url}`} onPress={this.onPress}>
                        <View style={[styles.row]}>
                            <View style={[AppStyles.row, AppStyles.flex6, AppStyles.centerAligned]}>
                                <Text style={styles.url}>{item.url}</Text>
                            </View>
                            {selected && (
                                <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                                    <Icon size={20} style={styles.checkIcon} name="IconCheck" />
                                </View>
                            )}
                        </View>
                    </TouchableDebounce>
                </Interactable.View>
            </View>
        );
    }
}

export default NodeListItem;
