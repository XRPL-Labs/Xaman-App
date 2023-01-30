import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenCancelOffer } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
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
                {transaction.NFTokenOffers?.map((token: string) => (
                    <View key={`${token}`} style={[styles.contentBox]}>
                        <Text style={styles.value}>{token}</Text>
                    </View>
                ))}
            </>
        );
    }
}

export default NFTokenCancelOfferTemplate;
