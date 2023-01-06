import { isEqual, find, flatMap } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { StyleService } from '@services';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CurrencyRepository } from '@store/repositories';

import { AmountText, Avatar, TokenAvatar, TouchableDebounce } from '@components/General';
import { PathOption } from '@common/libs/ledger/types';

import { Amount } from '@common/libs/ledger/parser/common';
import { AmountType } from '@common/libs/ledger/parser/types';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    amount: AmountType;
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

        if (typeof source_amount !== 'string') {
            return null;
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
                        <TokenAvatar token="XRP" border size={35} />
                    </View>
                    <View style={AppStyles.centerContent}>
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
        const { selected, amount } = this.props;
        const { source_amount, paths_computed } = item;

        if (typeof source_amount !== 'object') {
            return null;
        }

        let counterParty;
        let currency;
        let issuer;

        if (Array.isArray(paths_computed) && paths_computed.length === 0 && typeof amount === 'object') {
            issuer = amount.issuer;
        } else {
            issuer = find(flatMap(paths_computed), (o) => {
                return o.type === 1;
            });

            if (issuer) {
                issuer = issuer.account;
            }
        }

        if (issuer) {
            // check for vetted currency details
            currency = CurrencyRepository.findOne({
                issuer,
                currency: source_amount.currency,
            });
        }

        if (currency) {
            counterParty = CurrencyRepository.getCounterParty(currency);
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
        if (typeof source_amount === 'object') {
            return this.renderIOU(item);
        }

        return null;
    }
}

export default PathFindingItem;