import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { StyleService } from '@services';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CurrencyRepository } from '@store/repositories';

import { AmountText, Avatar, TokenAvatar, TouchableDebounce } from '@components/General';
import { PathOption } from '@common/libs/ledger/types';
import { Amount } from '@common/libs/ledger/parser/common';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    item: PathOption;
    selected?: boolean;
    onPress?: (item: PathOption) => void;
}

/* Component ==================================================================== */
class PathFindingItem extends Component<Props> {
    shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
        const { item, selected } = this.props;
        return !isEqual(nextProps.item, item) || !isEqual(nextProps.selected, selected);
    }

    renderXRP = (item: PathOption) => {
        const { selected } = this.props;

        const { source_amount } = item;

        return (
            <TouchableDebounce
                activeOpacity={0.8}
                onPress={this.onPress}
                style={[styles.container, selected && { ...styles.selected }]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[styles.dot, selected && styles.dotSelected]}>
                        {selected && <View style={styles.filled} />}
                    </View>
                </View>
                <View style={[AppStyles.row, AppStyles.flex3]}>
                    <View style={styles.currencyImageContainer}>
                        <TokenAvatar token="XRP" border size={35} />
                    </View>
                    <View style={{ justifyContent: 'center' }}>
                        <Text style={styles.currencyItemLabel}>XRP</Text>
                    </View>
                </View>
                <View style={[AppStyles.flex3, AppStyles.rightAligned]}>
                    <AmountText style={styles.currencyBalance} value={new Amount(source_amount).dropsToXrp()} />
                </View>
            </TouchableDebounce>
        );
    };

    onPress = () => {
        const { item, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(item);
        }
    };

    renderIOU = (item: PathOption) => {
        const { selected } = this.props;
        const { source_amount, paths_computed } = item;

        // check for vetted currency details
        const currency = CurrencyRepository.findOne({
            issuer: paths_computed[0][0].account,
            currency: source_amount.currency,
        });

        let counterParty;

        if (currency) {
            const c = currency.linkingObjects('CounterParty', 'currencies');
            if (!c.isEmpty()) {
                counterParty = c[0];
            }
        }

        return (
            <TouchableDebounce
                activeOpacity={0.8}
                onPress={this.onPress}
                style={[styles.container, selected && { ...styles.selected }]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[styles.dot, selected && styles.dotSelected]}>
                        {selected && <View style={styles.filled} />}
                    </View>
                </View>
                <View style={[AppStyles.row, AppStyles.flex3]}>
                    <View style={styles.currencyImageContainer}>
                        <Avatar
                            source={{
                                uri: counterParty
                                    ? counterParty.avatar
                                    : StyleService.getImage('ImageUnknownTrustLine').uri,
                            }}
                            border
                            size={35}
                        />
                    </View>
                    <View>
                        <Text style={styles.currencyItemLabel}>
                            {NormalizeCurrencyCode(currency?.name || source_amount.currency)}
                        </Text>
                        <Text style={styles.counterpartyLabel}>
                            {counterParty?.name} {NormalizeCurrencyCode(source_amount.currency)}
                        </Text>
                    </View>
                </View>
                <View style={[AppStyles.flex3, AppStyles.rightAligned]}>
                    <AmountText style={styles.currencyBalance} value={source_amount.value} />
                </View>
            </TouchableDebounce>
        );
    };

    render() {
        const { item } = this.props;
        const { source_amount } = item;

        // XRP
        if (typeof source_amount === 'string') {
            return this.renderXRP(item);
        }
        // IOU
        // @ts-ignore
        return this.renderIOU(item);
    }
}

export default PathFindingItem;
