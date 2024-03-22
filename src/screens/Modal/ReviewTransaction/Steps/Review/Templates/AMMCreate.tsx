import { isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { AMMCreate } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';

import Localize from '@locale';

import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: AMMCreate;
}

export interface State {}

/* Component ==================================================================== */
class AMMCreateTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.Amount) && (
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

                {!isUndefined(transaction.Amount2) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.amount2')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.Amount2.value}
                                currency={transaction.Amount2.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.TradingFee) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.tradingFee')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.TradingFee}%</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default AMMCreateTemplate;
