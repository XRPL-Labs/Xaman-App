import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { URITokenBuy } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';

import Localize from '@locale';

import styles from './styles';

import { TemplateProps } from './types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: URITokenBuy;
}

export interface State {}

/* Component ==================================================================== */
class URITokenBuyTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.uriTokeId')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.URITokenID}</Text>
                </View>

                <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                <View style={styles.contentBox}>
                    <AmountText
                        value={transaction.Amount.value}
                        currency={transaction.Amount.currency}
                        style={styles.amount}
                        immutable
                    />
                </View>
            </>
        );
    }
}

export default URITokenBuyTemplate;
