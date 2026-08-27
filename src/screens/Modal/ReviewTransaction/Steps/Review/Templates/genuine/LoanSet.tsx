import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { LoanSet } from '@common/libs/ledger/transactions';
import { LoanBroker, Vault } from '@common/libs/ledger/objects';

import { AmountText } from '@components/General';
import { AccountElement, CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: LoanSet;
}

export interface State {
    loanBrokerObject?: LoanBroker;
    vaultObject?: Vault;
}

/* Component ==================================================================== */
class LoanSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            loanBrokerObject: undefined,
            vaultObject: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchLoanBrokerObject);
    }

    fetchLoanBrokerObject = () => {
        const { transaction } = this.props;

        if (!transaction.LoanBrokerID) {
            return;
        }

        LedgerService.getLedgerEntry({ index: transaction.LoanBrokerID })
            .then((res: any) => {
                const loanBrokerEntry = get(res, 'node', undefined);

                if (loanBrokerEntry) {
                    const loanBrokerObject = new LoanBroker(loanBrokerEntry);
                    this.setState({ loanBrokerObject });

                    // Fetch the associated vault to get the asset info
                    if (loanBrokerObject.VaultID) {
                        this.fetchVaultObject(loanBrokerObject.VaultID);
                    }
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('loan.loanBrokerObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('loan.unableToGetLoanBrokerObject'));
            });
    };

    fetchVaultObject = (vaultId: string) => {
        LedgerService.getLedgerEntry({ index: vaultId })
            .then((res: any) => {
                const vaultEntry = get(res, 'node', undefined);

                if (vaultEntry) {
                    const vaultObject = new Vault(vaultEntry);
                    this.setState({ vaultObject });
                }
            })
            .catch(() => {
                // Vault fetch failed, continue without vault info
            });
    };

    formatRate = (value: number | undefined): string | undefined => {
        if (value === undefined) {
            return undefined;
        }
        return `${(value / 10000).toFixed(2)}%`;
    };

    formatDuration = (seconds: number | undefined): string | undefined => {
        if (seconds === undefined) {
            return undefined;
        }
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days} day${days !== 1 ? 's' : ''}`;
        }
        if (hours > 0) {
            return `${hours} hour${hours !== 1 ? 's' : ''}`;
        }
        return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    };

    render() {
        const { transaction } = this.props;
        const { loanBrokerObject, vaultObject } = this.state;

        return (
            <>
                {!isUndefined(transaction.LoanBrokerID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.loanBrokerId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.LoanBrokerID}</Text>
                        </View>
                    </>
                )}

                {loanBrokerObject?.Owner && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.lender')}</Text>
                        <AccountElement
                            address={loanBrokerObject.Owner}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {vaultObject?.Asset && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.asset')}</Text>
                        <View style={styles.contentBox}>
                            <CurrencyElement
                                issuer={vaultObject.Asset.issuer}
                                currency={vaultObject.Asset.currency}
                            />
                        </View>
                    </>
                )}

                {transaction.Counterparty && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.counterparty')}</Text>
                        <AccountElement
                            address={transaction.Counterparty}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {transaction.PrincipalRequested && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.principalRequested')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.PrincipalRequested.value}
                                currency={transaction.PrincipalRequested.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.PaymentTotal) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.paymentTotal')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.PaymentTotal}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.PaymentInterval) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.paymentInterval')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatDuration(transaction.PaymentInterval)}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.GracePeriod) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.gracePeriod')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatDuration(transaction.GracePeriod)}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.InterestRate) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.interestRate')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatRate(transaction.InterestRate)}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.LateInterestRate) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.lateInterestRate')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatRate(transaction.LateInterestRate)}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.CloseInterestRate) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.closeInterestRate')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatRate(transaction.CloseInterestRate)}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.OverpaymentInterestRate) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.overpaymentInterestRate')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatRate(transaction.OverpaymentInterestRate)}</Text>
                        </View>
                    </>
                )}

                {transaction.LoanOriginationFee && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.loanOriginationFee')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.LoanOriginationFee.value}
                                currency={transaction.LoanOriginationFee.currency}
                                style={styles.value}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.LoanServiceFee && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.loanServiceFee')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.LoanServiceFee.value}
                                currency={transaction.LoanServiceFee.currency}
                                style={styles.value}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.LatePaymentFee && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.latePaymentFee')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.LatePaymentFee.value}
                                currency={transaction.LatePaymentFee.currency}
                                style={styles.value}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.ClosePaymentFee && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.closePaymentFee')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.ClosePaymentFee.value}
                                currency={transaction.ClosePaymentFee.currency}
                                style={styles.value}
                                immutable
                            />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.OverpaymentFee) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.overpaymentFee')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatRate(transaction.OverpaymentFee)}</Text>
                        </View>
                    </>
                )}

                {transaction.Data && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.data')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.Data}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default LoanSetTemplate;
