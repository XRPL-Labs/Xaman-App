import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { LoanDelete } from '@common/libs/ledger/transactions';
import { Loan, LoanBroker } from '@common/libs/ledger/objects';

import { AmountText, InfoMessage } from '@components/General';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: LoanDelete;
}

export interface State {
    loanObject?: Loan;
    loanBrokerObject?: LoanBroker;
}

/* Component ==================================================================== */
class LoanDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            loanObject: undefined,
            loanBrokerObject: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchLoanObject);
    }

    fetchLoanObject = () => {
        const { transaction } = this.props;

        if (!transaction.LoanID) {
            return;
        }

        LedgerService.getLedgerEntry({ index: transaction.LoanID })
            .then((res: any) => {
                const loanEntry = get(res, 'node', undefined);

                if (loanEntry) {
                    const loanObject = new Loan(loanEntry);
                    this.setState({ loanObject });

                    // Fetch the loan broker to get more context
                    if (loanObject.LoanBrokerID) {
                        this.fetchLoanBrokerObject(loanObject.LoanBrokerID);
                    }
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('loan.loanObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('loan.unableToGetLoanObject'));
            });
    };

    fetchLoanBrokerObject = (loanBrokerId: string) => {
        LedgerService.getLedgerEntry({ index: loanBrokerId })
            .then((res: any) => {
                const loanBrokerEntry = get(res, 'node', undefined);

                if (loanBrokerEntry) {
                    const loanBrokerObject = new LoanBroker(loanBrokerEntry);
                    this.setState({ loanBrokerObject });
                }
            })
            .catch(() => {
                // LoanBroker fetch failed, continue without it
            });
    };

    render() {
        const { transaction } = this.props;
        const { loanObject, loanBrokerObject } = this.state;

        return (
            <>
                {!isUndefined(transaction.LoanID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.loanId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.LoanID}</Text>
                        </View>
                    </>
                )}

                {loanObject && (
                    <>
                        {loanObject.isDefaulted && (
                            <InfoMessage
                                type="error"
                                label={Localize.t('loan.loanIsDefaulted')}
                                containerStyle={AppStyles.marginBottomSml}
                            />
                        )}

                        {loanObject.isImpaired && (
                            <InfoMessage
                                type="warning"
                                label={Localize.t('loan.loanIsImpaired')}
                                containerStyle={AppStyles.marginBottomSml}
                            />
                        )}

                        {loanObject.Borrower && (
                            <>
                                <Text style={styles.label}>{Localize.t('loan.borrower')}</Text>
                                <AccountElement
                                    address={loanObject.Borrower}
                                    containerStyle={[styles.contentBox, styles.addressContainer]}
                                />
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

                        {loanObject.PrincipalOutstanding && (
                            <>
                                <Text style={styles.label}>{Localize.t('loan.principalOutstanding')}</Text>
                                <View style={styles.contentBox}>
                                    <AmountText
                                        value={loanObject.PrincipalOutstanding}
                                        style={styles.amount}
                                        immutable
                                    />
                                </View>
                            </>
                        )}

                        {loanObject.TotalValueOutstanding && (
                            <>
                                <Text style={styles.label}>{Localize.t('loan.totalValueOutstanding')}</Text>
                                <View style={styles.contentBox}>
                                    <AmountText
                                        value={loanObject.TotalValueOutstanding}
                                        style={styles.amount}
                                        immutable
                                    />
                                </View>
                            </>
                        )}

                        {!isUndefined(loanObject.PaymentRemaining) && (
                            <>
                                <Text style={styles.label}>{Localize.t('loan.paymentsRemaining')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.value}>{loanObject.PaymentRemaining}</Text>
                                </View>
                            </>
                        )}
                    </>
                )}
            </>
        );
    }
}

export default LoanDeleteTemplate;
