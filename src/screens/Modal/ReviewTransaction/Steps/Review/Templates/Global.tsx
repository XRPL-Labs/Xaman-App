import React, { Component } from 'react';
import { View, Text, Alert } from 'react-native';

import { LedgerService } from '@services';

import { Amount } from '@common/libs/ledger/parser/common';
import { TransactionsType } from '@common/libs/ledger/transactions/types';

// components
import { InfoMessage } from '@components/General';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: TransactionsType;
    canOverride: boolean;
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
        const { transaction, canOverride } = this.props;

        try {
            const { Fee } = LedgerService.getLedgerStatus();

            const minTransactionFee = new Amount(transaction.calculateFee(Fee)).dropsToXrp();

            // override the fee if
            // fee not set
            // the min transaction fee is more than set fee
            // the fee is more than enough

            const shouldOverrideFee =
                typeof transaction.Fee === 'undefined' ||
                Number(minTransactionFee) > Number(transaction.Fee) ||
                Number(transaction.Fee) > 0.1;

            // ignore overriding fee if multi sign
            if (shouldOverrideFee && canOverride) {
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
        } catch {
            Alert.alert(Localize.t('global.error', Localize.t('payload.unableToGetNetworkFee')));
        }
    }

    renderWarnings = () => {
        const { transaction } = this.props;

        if (transaction.Type === 'AccountDelete') {
            return <InfoMessage type="error" label={Localize.t('payload.accountDeleteExchangeSupportWarning')} />;
        }

        return null;
    };

    render() {
        const { transaction } = this.props;
        const { networkFee } = this.state;

        return (
            <>
                {transaction.Memos && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.memo')}</Text>
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

                <Text style={[styles.label]}>{Localize.t('global.fee')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.Fee || networkFee} XRP</Text>
                </View>

                {this.renderWarnings()}
            </>
        );
    }
}

export default GlobalTemplate;
