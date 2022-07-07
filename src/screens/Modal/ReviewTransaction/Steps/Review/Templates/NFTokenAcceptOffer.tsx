import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { LedgerService } from '@services';

import { NFTokenAcceptOffer } from '@common/libs/ledger/transactions';
import { NFTokenOffer } from '@common/libs/ledger/objects';

import { AmountText, LoadingIndicator, ExpandableView } from '@components/General';

import Localize from '@locale';

import NFTokenOfferTemplate from './objects/NFTokenOffer';

import styles from './styles';
/* types ==================================================================== */
export interface Props {
    transaction: NFTokenAcceptOffer;
}

export interface State {
    sellOffer: NFTokenOffer;
    buyOffer: NFTokenOffer;
    isLoadingSellOffer: boolean;
    isLoadingBuyOffer: boolean;
}

/* Component ==================================================================== */
class NFTokenAcceptOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            sellOffer: undefined,
            buyOffer: undefined,
            isLoadingSellOffer: !!props.transaction.NFTokenSellOffer,
            isLoadingBuyOffer: !!props.transaction.NFTokenBuyOffer,
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        // load the offers that are going to be accepted from ledger

        if (transaction.NFTokenSellOffer) {
            LedgerService.getLedgerEntry({ index: transaction.NFTokenSellOffer })
                .then((resp) => {
                    if (resp?.node?.LedgerEntryType === NFTokenOffer.Type) {
                        this.setState({
                            isLoadingSellOffer: false,
                            sellOffer: new NFTokenOffer(resp.node),
                        });
                    }
                })
                .catch(() => {});
        }

        if (transaction.NFTokenBuyOffer) {
            LedgerService.getLedgerEntry({ index: transaction.NFTokenBuyOffer })
                .then((resp) => {
                    if (resp?.node?.LedgerEntryType === NFTokenOffer.Type) {
                        this.setState({
                            isLoadingBuyOffer: false,
                            buyOffer: new NFTokenOffer(resp.node),
                        });
                    }
                })
                .catch(() => {});
        }
    }

    render() {
        const { transaction } = this.props;
        const { sellOffer, buyOffer, isLoadingSellOffer, isLoadingBuyOffer } = this.state;

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
                            {isLoadingSellOffer ? <LoadingIndicator /> : <NFTokenOfferTemplate object={sellOffer} />}
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
                            {isLoadingBuyOffer ? <LoadingIndicator /> : <NFTokenOfferTemplate object={buyOffer} />}
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
