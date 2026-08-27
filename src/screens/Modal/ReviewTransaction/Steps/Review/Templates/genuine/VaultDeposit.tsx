import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Alert, InteractionManager } from 'react-native';

import { LedgerService, NetworkService, StyleService } from '@services';

import { VaultDeposit } from '@common/libs/ledger/transactions';
import { Vault } from '@common/libs/ledger/objects';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AmountInput, AmountText, Button } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountElement, CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: VaultDeposit;
}

export interface State {
    vaultObject?: Vault;
    depositAmount?: string;
    editableAmount: boolean;
    currencyName: string;
}

/* Component ==================================================================== */
class VaultDepositTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        const currencyName = props.transaction.Amount?.currency
            ? NormalizeCurrencyCode(props.transaction.Amount.currency)
            : '';

        this.state = {
            vaultObject: undefined,
            editableAmount: !props.transaction.Amount?.value,
            depositAmount: props.transaction.Amount?.value,
            currencyName,
        };

        this.amountInput = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchVaultObject);
    }

    fetchVaultObject = () => {
        const { transaction } = this.props;
        const { depositAmount } = this.state;

        if (!transaction.VaultID) {
            return;
        }

        LedgerService.getLedgerEntry({ index: transaction.VaultID })
            .then((res: any) => {
                const vaultEntry = get(res, 'node', undefined);

                if (vaultEntry) {
                    const vaultObject = new Vault(vaultEntry);

                    const currencyName = vaultObject.Asset?.currency
                        ? NormalizeCurrencyCode(vaultObject.Asset.currency)
                        : NetworkService.getNativeAsset();

                    this.setState({
                        vaultObject,
                        currencyName,
                    });

                    // If no amount set yet, initialize the Amount with vault's asset
                    if (!depositAmount && vaultObject.Asset) {
                        this.onAmountChange('');
                    }
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('vault.vaultObjectDoesNotExist'));
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('vault.unableToGetVaultObject'));
            });
    };

    onAmountChange = (amount: string) => {
        const { transaction } = this.props;
        const { vaultObject, currencyName } = this.state;

        this.setState({
            depositAmount: amount,
        });

        if (vaultObject?.Asset) {
            if (vaultObject.Asset.issuer) {
                transaction.Amount = {
                    currency: vaultObject.Asset.currency,
                    issuer: vaultObject.Asset.issuer,
                    value: amount,
                };
            } else {
                transaction.Amount = {
                    currency: currencyName,
                    value: amount,
                };
            }
        }
    };

    focusAmountInput = () => {
        this.amountInput.current?.focus();
    };

    render() {
        const { transaction } = this.props;
        const { vaultObject, editableAmount, currencyName, depositAmount } = this.state;

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

                {vaultObject?.Owner && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.owner')}</Text>
                        <AccountElement
                            address={vaultObject.Owner}
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

                {/* Amount */}
                <Text style={styles.label}>{Localize.t('vault.depositAmount')}</Text>
                <View style={styles.contentBox}>
                    <TouchableOpacity activeOpacity={1} style={AppStyles.row} onPress={this.focusAmountInput}>
                        {editableAmount ? (
                            <>
                                <View style={[AppStyles.row, AppStyles.flex1]}>
                                    <AmountInput
                                        ref={this.amountInput}
                                        valueType={
                                            currencyName === NetworkService.getNativeAsset()
                                                ? AmountValueType.Native
                                                : AmountValueType.IOU
                                        }
                                        onChange={this.onAmountChange}
                                        style={styles.amountInput}
                                        value={depositAmount}
                                        editable={editableAmount}
                                        placeholderTextColor={StyleService.value('$textSecondary')}
                                    />
                                    <Text style={styles.amountInput}> {currencyName}</Text>
                                </View>
                                <Button
                                    onPress={this.focusAmountInput}
                                    style={styles.editButton}
                                    roundedMini
                                    icon="IconEdit"
                                    iconSize={13}
                                    light
                                />
                            </>
                        ) : (
                            <AmountText
                                value={depositAmount!}
                                currency={transaction.Amount?.currency || currencyName}
                                style={styles.amountInput}
                                immutable
                            />
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={[AppStyles.subtext, AppStyles.colorGrey, AppStyles.marginBottomSml]}>
                    {Localize.t('vault.depositAmountExplain')}
                </Text>
            </>
        );
    }
}

export default VaultDepositTemplate;
