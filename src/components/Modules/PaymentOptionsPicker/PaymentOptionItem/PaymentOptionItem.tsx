import { isEqual, find, flatMap } from 'lodash';
import React, { Component } from 'react';
import { View, Text, Animated } from 'react-native';

import { NetworkService, StyleService } from '@services';

import { Images } from '@common/helpers/images';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CurrencyRepository } from '@store/repositories';

import { AmountText, Avatar, TokenAvatar, TouchableDebounce } from '@components/General';

import { AmountType } from '@common/libs/ledger/parser/types';

import { AppStyles } from '@theme';
import styles from './styles';

import { PathFindPathOption } from '@common/libs/ledger/types/methods';

/* Types ==================================================================== */
interface Props {
    item: PathFindPathOption;
    index: number;
    amount: AmountType;
    selected?: boolean;
    onPress?: (item: PathFindPathOption) => void;
}

/* Component ==================================================================== */
class PaymentOptionItem extends Component<Props> {
    private readonly animatedFade: Animated.Value;
    private readonly animatedPlaceholder: Animated.Value;

    constructor(props: Props) {
        super(props);

        this.animatedFade = new Animated.Value(0);
        this.animatedPlaceholder = new Animated.Value(1);
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
        } else {
            this.startFadeInAnimation();
        }
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        const { item, index } = this.props;

        if (prevProps.item && !item) {
            // set animated fade value to zero
            this.animatedFade.setValue(0);

            // start placeholder animation
            setTimeout(this.startPlaceholderAnimation, index * 400);
        } else if (!prevProps.item && item) {
            // show the element with animation
            this.startFadeInAnimation();
        }
    }

    startFadeInAnimation = () => {
        Animated.timing(this.animatedFade, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    };

    startPlaceholderAnimation = () => {
        const { item } = this.props;

        // if item provided stop the placeholder animation
        if (item) {
            return;
        }

        Animated.sequence([
            Animated.timing(this.animatedPlaceholder, {
                toValue: 0.3,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(this.animatedPlaceholder, {
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

    renderNative = (item: PathFindPathOption) => {
        const { source_amount } = item;

        if (typeof source_amount !== 'string') {
            return null;
        }

        return (
            <>
                <View style={[AppStyles.row, AppStyles.flex3]}>
                    <View style={styles.currencyImageContainer}>
                        <TokenAvatar token="Native" border size={35} />
                    </View>
                    <View style={AppStyles.centerContent}>
                        <Text style={styles.currencyItemLabel}>{NetworkService.getNativeAsset()}</Text>
                    </View>
                </View>
                <View style={[AppStyles.flex3, AppStyles.rightAligned]}>
                    <AmountText style={styles.currencyBalance} value={source_amount} />
                </View>
            </>
        );
    };

    renderIOU = (item: PathFindPathOption) => {
        const { amount } = this.props;
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
            const typeOneStep = find(flatMap(paths_computed), (computed) => {
                return computed.type === 1;
            });

            if (typeOneStep) {
                issuer = typeOneStep.account;
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
            <>
                <View style={[AppStyles.row, AppStyles.flex3]}>
                    <View style={styles.currencyImageContainer}>
                        <Avatar
                            source={{
                                uri: counterParty
                                    ? counterParty.avatar
                                    : StyleService.getImage('ImageUnknownTrustLine')?.uri,
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
            </>
        );
    };

    renderPlaceHolder = () => {
        return (
            <Animated.View style={styles.container}>
                <View style={[AppStyles.row, AppStyles.flex3]}>
                    <Animated.View style={[styles.currencyImageContainer, { opacity: this.animatedPlaceholder }]}>
                        <Avatar source={Images.ImageUnknownTrustLineLight} border size={35} />
                    </Animated.View>
                    <View style={AppStyles.centerContent}>
                        <Animated.Text
                            numberOfLines={1}
                            style={[
                                styles.currencyItemLabel,
                                styles.currencyItemLabelPlaceholder,
                                { opacity: this.animatedPlaceholder },
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
                            { opacity: this.animatedPlaceholder },
                        ]}
                    >
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                    </Animated.Text>
                </View>
            </Animated.View>
        );
    };

    renderContent = () => {
        const { item } = this.props;

        const { source_amount } = item;

        if (typeof source_amount === 'string') {
            return this.renderNative(item);
        }
        if (typeof source_amount === 'object') {
            return this.renderIOU(item);
        }

        return null;
    };

    render() {
        const { item, selected } = this.props;

        if (!item) {
            return this.renderPlaceHolder();
        }

        return (
            <Animated.View style={{ opacity: this.animatedFade }}>
                <TouchableDebounce
                    activeOpacity={0.8}
                    onPress={this.onPress}
                    style={[styles.container, selected && styles.selected]}
                >
                    {this.renderContent()}
                </TouchableDebounce>
            </Animated.View>
        );
    }
}

export default PaymentOptionItem;
