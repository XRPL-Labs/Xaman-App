import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { PaymentChannelAuthorize } from '@common/libs/ledger/transactions/pseudo';

import { AmountText } from '@components/General';

import Localize from '@locale';

import { TemplateProps } from '../types';

import styles from '../styles';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: PaymentChannelAuthorize;
}

export interface State {}

/* Component ==================================================================== */
class PaymentChannelAuthorizeTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                <View style={styles.contentBox}>
                    <AmountText
                        value={transaction.Amount!.value}
                        currency={transaction.Amount!.currency}
                        style={styles.amount}
                        immutable
                    />
                </View>

                <Text style={styles.label}>{Localize.t('global.channel')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.Channel}</Text>
                </View>
            </>
        );
    }
}

export default PaymentChannelAuthorizeTemplate;
