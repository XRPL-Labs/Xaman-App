import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { PaymentChannelFund } from '@common/libs/ledger/transactions';

import { FormatDate } from '@common/utils/date';

import { AmountText } from '@components/General';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: PaymentChannelFund;
}

export interface State {}

/* Component ==================================================================== */
class PaymentChannelFundTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;
        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.channel')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{transaction.Channel}</Text>
                </View>

                <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>
                <View style={[styles.contentBox]}>
                    <AmountText
                        value={transaction.Amount.value}
                        postfix={transaction.Amount.currency}
                        style={styles.amount}
                    />
                </View>

                {transaction.Expiration && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.expireAfter')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{FormatDate(transaction.Expiration)}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default PaymentChannelFundTemplate;
