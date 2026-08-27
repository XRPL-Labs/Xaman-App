import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { LoanBrokerCoverClawback } from '@common/libs/ledger/transactions';
import { LoanBroker, Vault } from '@common/libs/ledger/objects';

import { AmountText, InfoMessage } from '@components/General';
import { AccountElement, CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: LoanBrokerCoverClawback;
}

export interface State {
    loanBrokerObject?: LoanBroker;
    vaultObject?: Vault;
}

/* Component ==================================================================== */
class LoanBrokerCoverClawbackTemplate extends Component<Props, State> {
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

                    this.setState({
                        vaultObject,
                    });
                }
            })
            .catch(() => {
                // Vault fetch failed, continue without vault info
            });
    };

    render() {
        const { transaction } = this.props;
        const { loanBrokerObject, vaultObject } = this.state;

        return (
            <>
                <InfoMessage
                    type="warning"
                    label={Localize.t('loan.coverClawbackWarning')}
                    containerStyle={AppStyles.marginBottomSml}
                />

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
                        <Text style={styles.label}>{Localize.t('global.owner')}</Text>
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

                {loanBrokerObject?.CoverAvailable && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.currentCoverAvailable')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={loanBrokerObject.CoverAvailable}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.Amount && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.clawbackAmount')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.Amount.value}
                                currency={transaction.Amount.currency}
                                style={styles.amountRed}
                                immutable
                            />
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default LoanBrokerCoverClawbackTemplate;
