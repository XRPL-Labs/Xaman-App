import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { LedgerService } from '@services';

import { Amount } from '@common/libs/ledger/parser/common';
import { TransactionsType } from '@common/libs/ledger/transactions/types';

// components
// import { Spacer } from '@components';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: TransactionsType;
}

export interface State {
    networkFee: number;
}

/* Component ==================================================================== */
class GlobalTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            networkFee: undefined,
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        const { Fee } = LedgerService.getLedgerStatus();
        const minTransactionFee = new Amount(transaction.calculateFee(Fee)).dropsToXrp();

        if (!transaction.Fee || Number(minTransactionFee) > Number(transaction.Fee)) {
            // set the min transaction fee
            transaction.Fee = minTransactionFee;

            this.setState({
                networkFee: Number(minTransactionFee),
            });
        } else {
            this.setState({
                networkFee: Number(transaction.Fee),
            });
        }
    }

    render() {
        const { transaction } = this.props;
        const { networkFee } = this.state;

        return (
            <>
                {transaction.Memos && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.memo')}:</Text>
                        <View style={[styles.contentBox]}>
                            {transaction.Memos.map((m: any) => {
                                let memo = '';
                                memo += m.type ? `${m.type}\n` : '';
                                memo += m.format ? `${m.format}\n` : '';
                                memo += m.data ? `${m.data}` : '';
                                return (
                                    <>
                                        <Text style={styles.value}>{memo}</Text>
                                    </>
                                );
                            })}
                        </View>
                    </>
                )}

                <Text style={[styles.label]}>{Localize.t('global.fee')}:</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.Fee || networkFee} XRP</Text>
                </View>
            </>
        );
    }
}

export default GlobalTemplate;
