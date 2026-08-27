import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { VaultClawback } from '@common/libs/ledger/transactions';
import { Vault } from '@common/libs/ledger/objects';

import { AmountText } from '@components/General';
import { AccountElement, CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: VaultClawback;
}

export interface State {
    vaultObject?: Vault;
}

/* Component ==================================================================== */
class VaultClawbackTemplate extends Component<Props, State> {
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

    render() {
        const { transaction } = this.props;
        const { vaultObject } = this.state;

        return (
            <>
                {!isUndefined(transaction.VaultID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.vaultId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.VaultID}</Text>
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

                {!isUndefined(transaction.Holder) && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.clawbackHolder')}</Text>
                        <AccountElement
                            address={transaction.Holder}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                        <Text style={[AppStyles.subtext, AppStyles.colorGrey, AppStyles.marginBottomSml]}>
                            {Localize.t('vault.clawbackHolderExplain')}
                        </Text>
                    </>
                )}

                {!isUndefined(transaction.Amount) && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.clawbackAmount')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.Amount.value}
                                currency={transaction.Amount.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                        <Text style={[AppStyles.subtext, AppStyles.colorGrey, AppStyles.marginBottomSml]}>
                            {Localize.t('vault.clawbackAmountExplain')}
                        </Text>
                    </>
                )}
            </>
        );
    }
}

export default VaultClawbackTemplate;
