/* eslint-disable react/jsx-one-expression-per-line */

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenAcceptOffer } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { AmountText } from '@components/General';

import styles from './styles';
/* types ==================================================================== */
export interface Props {
    transaction: NFTokenAcceptOffer;
}

export interface State {}

/* Component ==================================================================== */
class NFTokenAcceptOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.NFTokenSellOffer && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.sellOffer')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{transaction.NFTokenSellOffer}</Text>
                        </View>
                    </>
                )}

                {transaction.NFTokenBuyOffer && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.buyOffer')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{transaction.NFTokenBuyOffer}</Text>
                        </View>
                    </>
                )}

                {transaction.NFTokenBrokerFee && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.brokerFee')}</Text>
                        <View style={[styles.contentBox]}>
                            <AmountText
                                value={transaction.NFTokenBrokerFee.value}
                                currency={transaction.NFTokenBrokerFee.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default NFTokenAcceptOfferTemplate;
