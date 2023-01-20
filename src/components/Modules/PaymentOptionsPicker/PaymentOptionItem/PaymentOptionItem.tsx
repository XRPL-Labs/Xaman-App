import { isEqual, find, flatMap } from 'lodash';
import React, { Component } from 'react';
import { View, Text, Animated } from 'react-native';

import { Images } from '@common/helpers/images';
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
    item: PathOption;
    index: number;
    amount: AmountType;
    selected?: boolean;
    onPress?: (item: PathOption) => void;
}

/* Component ==================================================================== */
class PaymentOptionItem extends Component<Props> {
    private readonly animatedFade: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.animatedFade = new Animated.Value(1);
    }

    shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
        const { item, selected } = this.props;
        return !isEqual(nextProps.item, item) || !isEqual(nextProps.selected, selected);
    }

    componentDidMount() {
        const { item, index } = this.props;

        // if no item present start placeholder animation
        if (!item) {
            setTimeout(this.startPlaceholderAnimation, index * 400);
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { item, index } = this.props;

        if (prevProps.item && !item) {
            setTimeout(this.startPlaceholderAnimation, index * 400);
        }
    }

    startPlaceholderAnimation = () => {
        const { item } = this.props;

        // if item provided stop the placeholder animation
        if (item) {
            return;
        }

        Animated.sequence([
            Animated.timing(this.animatedFade, {
                toValue: 0.3,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedFade, {
                toValue: 0.8,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start(this.startPlaceholderAnimation);
    };

    onPress = () => {
        const { item, onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress(item);
        }
    };

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
                style={[styles.container, selected && styles.selected]}
            >
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
                style={[styles.container, selected && styles.selected]}
            >
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
                        <Text numberOfLines={1} style={styles.counterpartyLabel}>
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

    renderPlaceHolder = () => {
        return (
            <Animated.View style={styles.container}>
                <View style={[AppStyles.row, AppStyles.flex3]}>
                    <Animated.View style={[styles.currencyImageContainer, { opacity: this.animatedFade }]}>
                        <Avatar source={Images.ImageUnknownTrustLineLight} border size={35} />
                    </Animated.View>
                    <View style={AppStyles.centerContent}>
                        <Animated.Text
                            numberOfLines={1}
                            style={[
                                styles.currencyItemLabel,
                                styles.currencyItemLabelPlaceholder,
                                { opacity: this.animatedFade },
                            ]}
                        >
                            &nbsp;&nbsp;&nbsp;&nbsp;
                        </Animated.Text>
                    </View>
                </View>
                <View style={[AppStyles.flex3, AppStyles.rightAligned]}>
                    <Animated.Text
                        numberOfLines={1}
                        style={[
                            styles.currencyBalance,
                            styles.currencyBalancePlaceholder,
                            { opacity: this.animatedFade },
                        ]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                </View>
            </Animated.View>
        );
    };

    render() {
        const { item } = this.props;

        if (!item) {
            return this.renderPlaceHolder();
        }

        const { source_amount } = item;

        if (typeof source_amount === 'string') {
            return this.renderXRP(item);
        }
        if (typeof source_amount === 'object') {
            return this.renderIOU(item);
        }

        return null;
    }
}

export default PaymentOptionItem;
