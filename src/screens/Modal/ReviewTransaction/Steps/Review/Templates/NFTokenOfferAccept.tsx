/* eslint-disable react/jsx-one-expression-per-line */

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenOfferAccept } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { AmountText } from '@components/General';

import styles from './styles';
/* types ==================================================================== */
export interface Props {
    transaction: NFTokenOfferAccept;
}

export interface State {}

/* Component ==================================================================== */
class NFTokenOfferAcceptTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.Amount && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>
                        <View style={[styles.contentBox]}>
                            <AmountText
                                value={transaction.Amount.value}
                                postfix={transaction.Amount.currency}
                                style={styles.amount}
                            />
                        </View>
                    </>
                )}

                {transaction.SellOffer && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.sellOffer')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{transaction.SellOffer}</Text>
                        </View>
                    </>
                )}

                {transaction.BuyOffer && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.buyOffer')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{transaction.BuyOffer}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default NFTokenOfferAcceptTemplate;
