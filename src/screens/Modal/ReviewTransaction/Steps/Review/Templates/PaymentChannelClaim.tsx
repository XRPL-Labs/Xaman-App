import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { PaymentChannelClaim } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';

import Localize from '@locale';

import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: PaymentChannelClaim;
}

export interface State {}

/* Component ==================================================================== */
class PaymentChannelClaimTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;
        return (
            <>
                <Text style={styles.label}>{Localize.t('global.channel')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.Channel}</Text>
                </View>

                {transaction.Amount && (
                    <>
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
                )}

                {transaction.Balance && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.balance')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.Balance.value}
                                currency={transaction.Balance.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.Signature && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.signature')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.Signature}</Text>
                        </View>
                    </>
                )}

                {transaction.PublicKey && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.publicKey')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.PublicKey}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default PaymentChannelClaimTemplate;
