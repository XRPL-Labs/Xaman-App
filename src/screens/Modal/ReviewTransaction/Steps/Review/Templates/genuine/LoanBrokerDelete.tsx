import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { LoanBrokerDelete } from '@common/libs/ledger/transactions';
import { LoanBroker } from '@common/libs/ledger/objects';

import { AmountText } from '@components/General';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: LoanBrokerDelete;
}

export interface State {
    loanBrokerObject?: LoanBroker;
}

/* Component ==================================================================== */
class LoanBrokerDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            loanBrokerObject: undefined,
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
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('loan.loanBrokerObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('loan.unableToGetLoanBrokerObject'));
            });
    };

    render() {
        const { transaction } = this.props;
        const { loanBrokerObject } = this.state;

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

                {loanBrokerObject && (
                    <>
                        {loanBrokerObject.Owner && (
                            <>
                                <Text style={styles.label}>{Localize.t('global.owner')}</Text>
                                <AccountElement
                                    address={loanBrokerObject.Owner}
                                    containerStyle={[styles.contentBox, styles.addressContainer]}
                                />
                            </>
                        )}

                        {loanBrokerObject.VaultID && (
                            <>
                                <Text style={styles.label}>{Localize.t('vault.vaultId')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.valueSubtext}>{loanBrokerObject.VaultID}</Text>
                                </View>
                            </>
                        )}

                        {loanBrokerObject.DebtTotal && (
                            <>
                                <Text style={styles.label}>{Localize.t('loan.debtTotal')}</Text>
                                <View style={styles.contentBox}>
                                    <AmountText
                                        value={loanBrokerObject.DebtTotal}
                                        style={styles.amount}
                                        immutable
                                    />
                                </View>
                            </>
                        )}

                        {loanBrokerObject.CoverAvailable && (
                            <>
                                <Text style={styles.label}>{Localize.t('loan.coverAvailable')}</Text>
                                <View style={styles.contentBox}>
                                    <AmountText
                                        value={loanBrokerObject.CoverAvailable}
                                        style={styles.amount}
                                        immutable
                                    />
                                </View>
                            </>
                        )}

                        {!isUndefined(loanBrokerObject.OwnerCount) && (
                            <>
                                <Text style={styles.label}>{Localize.t('loan.ownerCount')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.value}>{loanBrokerObject.OwnerCount}</Text>
                                </View>
                            </>
                        )}
                    </>
                )}
            </>
        );
    }
}

export default LoanBrokerDeleteTemplate;
