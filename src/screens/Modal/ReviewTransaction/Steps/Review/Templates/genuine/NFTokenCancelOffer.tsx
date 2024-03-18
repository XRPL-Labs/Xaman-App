import React, { Component, Fragment } from 'react';
import { View, Text } from 'react-native';

import { NFTokenCancelOffer } from '@common/libs/ledger/transactions';

import { ExpandableView } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import NFTokenOfferTemplate from '../objects/NFTokenOffer';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: NFTokenCancelOffer;
}

export interface State {}
/* Component ==================================================================== */
class NFTokenCancelOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.tokenOffers')}
                    </Text>
                </View>
                {transaction.NFTokenOffers?.map((tokenOffer: string) => (
                    <ExpandableView
                        key={tokenOffer}
                        expanded={transaction.NFTokenOffers?.length === 1}
                        title={tokenOffer}
                        titleStyle={styles.value}
                        containerStyle={styles.objectTemplateContainer}
                        contentContainerStyle={styles.objectTemplateChildContainer}
                    >
                        <NFTokenOfferTemplate nfTokenOffer={tokenOffer} />
                    </ExpandableView>
                ))}
            </>
        );
    }
}

export default NFTokenCancelOfferTemplate;
