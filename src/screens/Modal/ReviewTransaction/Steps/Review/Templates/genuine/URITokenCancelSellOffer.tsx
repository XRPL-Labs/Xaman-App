import React, { Component } from 'react';
import { Text } from 'react-native';

import { URITokenCancelSellOffer } from '@common/libs/ledger/transactions';

import { ExpandableView } from '@components/General';

import Localize from '@locale';

import URITokenOffer from '../objects/URITokenOffer';

import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: URITokenCancelSellOffer;
}

export interface State {}

/* Component ==================================================================== */
class URITokenCancelSellOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction, source } = this.props;

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.uriTokenOffer')}</Text>
                <ExpandableView
                    expanded
                    title={transaction.URITokenID}
                    titleStyle={styles.value}
                    containerStyle={styles.objectTemplateContainer}
                    contentContainerStyle={styles.objectTemplateChildContainer}
                >
                    <URITokenOffer source={source} uriTokenId={transaction.URITokenID!} />
                </ExpandableView>
            </>
        );
    }
}

export default URITokenCancelSellOfferTemplate;
