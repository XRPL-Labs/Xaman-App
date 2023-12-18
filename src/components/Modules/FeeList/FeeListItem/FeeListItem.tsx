import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { Amount } from '@common/libs/ledger/parser/common';

import { NetworkService, StyleService } from '@services';
import { TouchableDebounce } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';

import styles from './styles';
/* Component ==================================================================== */

/* types ==================================================================== */
export interface Props {
    item: any;
    selected?: boolean;
    onPress?: (item: any) => void;
}

export interface State {}

/* component ==================================================================== */
class FeeItemList extends PureComponent<Props, State> {
    onPress = () => {
        const { item, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(item);
        }
    };

    getColor = () => {
        const { item } = this.props;

        switch (item.type) {
            case 'LOW':
                return StyleService.value('$green');
            case 'MEDIUM':
                return StyleService.value('$orange');
            case 'HIGH':
                return StyleService.value('$red');
            default:
                return StyleService.value('$red');
        }
    };

    getLabel = () => {
        const { item } = this.props;

        switch (item.type) {
            case 'LOW':
                return Localize.t('global.low');
            case 'MEDIUM':
                return Localize.t('global.medium');
            case 'HIGH':
                return Localize.t('global.high');
            default:
                return '';
        }
    };

    render() {
        const { selected, item } = this.props;

        const { type, value, suggested } = item;

        const color = this.getColor();
        const label = this.getLabel();
        const normalizedValue = new Amount(value).dropsToNative();

        return (
            <TouchableDebounce
                key={`${type}`}
                activeOpacity={0.8}
                onPress={this.onPress}
                style={[styles.item, selected && { ...styles.selected, borderColor: color }]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[styles.dot, selected && [styles.dotSelected, { borderColor: color }]]}>
                        {selected && <View style={[styles.filled, { backgroundColor: color }]} />}
                    </View>
                </View>
                <View style={AppStyles.flex3}>
                    <Text style={[styles.label, selected && { color }]}>{label}</Text>
                    {suggested && (
                        <Text style={[styles.labelSmall, selected && { color }]}>{Localize.t('global.suggested')}</Text>
                    )}
                </View>
                <View style={[AppStyles.flex3, AppStyles.rightAligned]}>
                    <Text style={[styles.value, selected && { color }]}>
                        {normalizedValue} {NetworkService.getNativeAsset()}
                    </Text>
                </View>
            </TouchableDebounce>
        );
    }
}

export default FeeItemList;
