import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { PaymentChannelCreate } from '@common/libs/ledger/transactions';

import { FormatDate } from '@common/utils/date';

import { AmountText } from '@components/General';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: PaymentChannelCreate;
}

export interface State {}

/* Component ==================================================================== */
class PaymentChannelCreateTemplate extends Component<Props, State> {
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
                        {Localize.t('global.to')}
                    </Text>
                </View>
                <AccountElement
                    address={transaction.Destination}
                    tag={transaction.DestinationTag}
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                />

                <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                <View style={styles.contentBox}>
                    <AmountText
                        value={transaction.Amount!.value}
                        currency={transaction.Amount!.currency}
                        style={styles.amount}
                        immutable
                    />
                </View>

                {transaction.SettleDelay && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.settleDelay')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>
                                {transaction.SettleDelay} {Localize.t('global.seconds')}
                            </Text>
                        </View>
                    </>
                )}

                {transaction.CancelAfter && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.cancelAfter')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(transaction.CancelAfter)}</Text>
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

export default PaymentChannelCreateTemplate;
