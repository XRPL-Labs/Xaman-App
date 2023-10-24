import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import StyleService from '@services/StyleService';

import { TouchableDebounce, Badge } from '@components/General';

import { NodeModel } from '@store/models';

import Localize from '@locale';

import { AppStyles } from '@theme';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    item: NodeModel;
    isDefault?: boolean;
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
        const { isDefault, item } = this.props;

        return (
            <TouchableDebounce
                style={styles.row}
                activeOpacity={0.8}
                testID={`node-${item.endpoint}`}
                onPress={this.onPress}
            >
                <View style={[AppStyles.row, AppStyles.flex6, AppStyles.centerAligned]}>
                    <Text style={styles.url}>{item.endpoint}</Text>
                </View>
                {isDefault && (
                    <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                        <Badge label={Localize.t('global.default')} color={StyleService.value('$grey')} />
                    </View>
                )}
            </TouchableDebounce>
        );
    }
}

export default NodeListItem;
