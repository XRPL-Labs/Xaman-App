import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenAcceptOffer } from '@common/libs/ledger/transactions';

import { AmountText, ExpandableView } from '@components/General';

import Localize from '@locale';

import NFTokenOfferTemplate from './objects/NFTokenOffer';

import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: NFTokenAcceptOffer;
}

export interface State {}
/* Component ==================================================================== */
class NFTokenAcceptOfferTemplate extends Component<Props, State> {
    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.NFTokenSellOffer && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.sellOffer')}</Text>
                        <ExpandableView
                            expanded
                            title={transaction.NFTokenSellOffer}
                            titleStyle={styles.value}
                            containerStyle={styles.objectTemplateContainer}
                            contentContainerStyle={styles.objectTemplateChildContainer}
                        >
                            <NFTokenOfferTemplate nfTokenOffer={transaction.NFTokenSellOffer} />
                        </ExpandableView>
                    </>
                )}

                {transaction.NFTokenBuyOffer && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.buyOffer')}</Text>
                        <ExpandableView
                            expanded
                            title={transaction.NFTokenBuyOffer}
                            titleStyle={styles.value}
                            containerStyle={styles.objectTemplateContainer}
                            contentContainerStyle={styles.objectTemplateChildContainer}
                        >
                            <NFTokenOfferTemplate nfTokenOffer={transaction.NFTokenBuyOffer} />
                        </ExpandableView>
                    </>
                )}

                {transaction.NFTokenBrokerFee && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.brokerFee')}</Text>
                        <View style={styles.contentBox}>
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
