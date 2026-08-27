import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { LoanBrokerSet } from '@common/libs/ledger/transactions';
import { Vault } from '@common/libs/ledger/objects';

import { AmountText, InfoMessage } from '@components/General';
import { AccountElement, CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: LoanBrokerSet;
}

export interface State {
    vaultObject?: Vault;
}

/* Component ==================================================================== */
class LoanBrokerSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            vaultObject: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchVaultObject);
    }

    fetchVaultObject = () => {
        const { transaction } = this.props;

        if (!transaction.VaultID) {
            return;
        }

        LedgerService.getLedgerEntry({ index: transaction.VaultID })
            .then((res: any) => {
                const vaultEntry = get(res, 'node', undefined);

                if (vaultEntry) {
                    const vaultObject = new Vault(vaultEntry);
                    this.setState({ vaultObject });
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('vault.vaultObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('vault.unableToGetVaultObject'));
            });
    };

    formatRate = (value: number | undefined): string | undefined => {
        if (value === undefined) {
            return undefined;
        }
        return `${(value / 10000).toFixed(2)}%`;
    };

    render() {
        const { transaction } = this.props;
        const { vaultObject } = this.state;

        return (
            <>
                {transaction.isUpdate && (
                    <InfoMessage
                        type="info"
                        label={Localize.t('loan.loanBrokerUpdateExplain')}
                        containerStyle={AppStyles.marginBottomSml}
                    />
                )}

                {!isUndefined(transaction.VaultID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.vaultId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.VaultID}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.LoanBrokerID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.loanBrokerId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.LoanBrokerID}</Text>
                        </View>
                    </>
                )}

                {vaultObject && (
                    <>
                        {vaultObject.Owner && (
                            <>
                                <Text style={styles.label}>{Localize.t('global.owner')}</Text>
                                <AccountElement
                                    address={vaultObject.Owner}
                                    containerStyle={[styles.contentBox, styles.addressContainer]}
                                />
                            </>
                        )}

                        {vaultObject.Asset && (
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
                    </>
                )}

                {transaction.DebtMaximum && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.debtMaximum')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.DebtMaximum.value}
                                currency={transaction.DebtMaximum.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.CoverRateMinimum) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.coverRateMinimum')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatRate(transaction.CoverRateMinimum)}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.CoverRateLiquidation) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.coverRateLiquidation')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatRate(transaction.CoverRateLiquidation)}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.ManagementFeeRate) && (
                    <>
                        <Text style={styles.label}>{Localize.t('loan.managementFeeRate')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{this.formatRate(transaction.ManagementFeeRate)}</Text>
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

export default LoanBrokerSetTemplate;
