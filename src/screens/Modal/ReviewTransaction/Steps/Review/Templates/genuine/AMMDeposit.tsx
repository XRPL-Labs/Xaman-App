import { isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { AMMDeposit } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';
import { CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: AMMDeposit;
}

export interface State {}

/* Component ==================================================================== */
class AMMDepositTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.Asset) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.asset')}</Text>
                        <View style={styles.contentBox}>
                            <CurrencyElement issuer={transaction.Asset.issuer} currency={transaction.Asset.currency} />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Asset2) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.asset2')}</Text>
                        <View style={styles.contentBox}>
                            <CurrencyElement
                                issuer={transaction.Asset2.issuer}
                                currency={transaction.Asset2.currency}
                            />
                        </View>
                    </>
                )}

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

                {!isUndefined(transaction.EPrice) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.ePrice')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.EPrice.value}
                                currency={transaction.EPrice.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.LPTokenOut) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.lpTokenOut')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.LPTokenOut.value}
                                currency={transaction.LPTokenOut.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default AMMDepositTemplate;
