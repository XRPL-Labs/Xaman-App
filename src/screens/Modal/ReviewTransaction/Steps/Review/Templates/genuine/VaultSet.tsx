import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { VaultSet } from '@common/libs/ledger/transactions';
import { Vault } from '@common/libs/ledger/objects';

import { AmountText } from '@components/General';
import { AccountElement, CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: VaultSet;
}

export interface State {
    vaultObject?: Vault;
}

/* Component ==================================================================== */
class VaultSetTemplate extends Component<Props, State> {
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

                {!isUndefined(transaction.AssetsMaximum) && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.assetsMaximum')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.AssetsMaximum.value}
                                currency={transaction.AssetsMaximum.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.DomainID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.domainId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.DomainID}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Data) && (
                    <>
                        <Text style={styles.label}>{Localize.t('vault.data')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.Data}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default VaultSetTemplate;
