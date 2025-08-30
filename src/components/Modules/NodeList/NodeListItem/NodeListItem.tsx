import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { TouchableDebounce } from '@components/General';

import { NodeModel } from '@store/models';

import { AppStyles } from '@theme';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    item: NodeModel;
    isDefault?: boolean;
    selectable?: boolean;
    onPress?: (item: NodeModel) => void;
}

export interface State {}

/* component ==================================================================== */
class NodeListItem extends PureComponent<Props, State> {
    onPress = () => {
        const { item, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(item);
        }
    };

    render() {
        const { item, isDefault, selectable } = this.props;

        return (
            <TouchableDebounce
                testID={`node-${item.endpoint}`}
                activeOpacity={0.8}
                onPress={this.onPress}
                style={[styles.container, isDefault && selectable && styles.selected]}
            >
                <View style={AppStyles.flex6}>
                    <Text style={[styles.url, isDefault && selectable && styles.urlSelected]}>{item.endpoint}</Text>
                </View>

                {selectable && (
                    <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                        <View style={[styles.dot, isDefault && styles.dotSelected]}>
                            {isDefault && (
                                <View style={[styles.dot, styles.dotSelected, styles.innerDot]} />
                            )}
                        </View>
                    </View>
                )}
            </TouchableDebounce>
        );
    }
}

export default NodeListItem;
