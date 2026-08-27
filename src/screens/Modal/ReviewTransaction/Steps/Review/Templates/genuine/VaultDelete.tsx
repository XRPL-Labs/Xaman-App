import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { LedgerService } from '@services';

import { VaultDelete } from '@common/libs/ledger/transactions';
import { Vault } from '@common/libs/ledger/objects';

import { AmountText, InfoMessage } from '@components/General';
import { AccountElement, CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: VaultDelete;
}

export interface State {
    vaultObject?: Vault;
}

/* Component ==================================================================== */
class VaultDeleteTemplate extends Component<Props, State> {
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
                        {vaultObject.isPrivate && (
                            <InfoMessage
                                type="info"
                                label={Localize.t('vault.isPrivateExplain')}
                                containerStyle={AppStyles.marginBottomSml}
                            />
                        )}

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

                        {vaultObject.AssetsTotal && (
                            <>
                                <Text style={styles.label}>{Localize.t('vault.assetsTotal')}</Text>
                                <View style={styles.contentBox}>
                                    <AmountText
                                        value={vaultObject.AssetsTotal.value}
                                        currency={vaultObject.AssetsTotal.currency}
                                        style={styles.amount}
                                        immutable
                                    />
                                </View>
                            </>
                        )}

                        {vaultObject.AssetsAvailable && (
                            <>
                                <Text style={styles.label}>{Localize.t('vault.assetsAvailable')}</Text>
                                <View style={styles.contentBox}>
                                    <AmountText
                                        value={vaultObject.AssetsAvailable.value}
                                        currency={vaultObject.AssetsAvailable.currency}
                                        style={styles.amount}
                                        immutable
                                    />
                                </View>
                            </>
                        )}

                        {!isUndefined(vaultObject.Scale) && (
                            <>
                                <Text style={styles.label}>{Localize.t('vault.scale')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.value}>{vaultObject.Scale}</Text>
                                </View>
                            </>
                        )}

                        {!isUndefined(vaultObject.WithdrawalPolicy) && (
                            <>
                                <Text style={styles.label}>{Localize.t('vault.withdrawalPolicy')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.value}>{vaultObject.WithdrawalPolicy}</Text>
                                </View>
                            </>
                        )}

                        {vaultObject.ShareMPTID && (
                            <>
                                <Text style={styles.label}>{Localize.t('vault.mptId')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.valueSubtext}>{vaultObject.ShareMPTID}</Text>
                                </View>
                            </>
                        )}

                        {vaultObject.DomainID && (
                            <>
                                <Text style={styles.label}>{Localize.t('vault.domainId')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.valueSubtext}>{vaultObject.DomainID}</Text>
                                </View>
                            </>
                        )}

                        {vaultObject.Data && (
                            <>
                                <Text style={styles.label}>{Localize.t('vault.data')}</Text>
                                <View style={styles.contentBox}>
                                    <Text style={styles.value}>{vaultObject.Data}</Text>
                                </View>
                            </>
                        )}
                    </>
                )}
            </>
        );
    }
}

export default VaultDeleteTemplate;
