import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Alert, InteractionManager } from 'react-native';

import { LedgerService, NetworkService, StyleService } from '@services';

import { LoanBrokerCoverDeposit } from '@common/libs/ledger/transactions';
import { LoanBroker, Vault } from '@common/libs/ledger/objects';

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
    transaction: LoanBrokerCoverDeposit;
}

export interface State {
    loanBrokerObject?: LoanBroker;
    vaultObject?: Vault;
    depositAmount?: string;
    editableAmount: boolean;
    currencyName: string;
}

/* Component ==================================================================== */
class LoanBrokerCoverDepositTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        const currencyName = props.transaction.Amount?.currency
            ? NormalizeCurrencyCode(props.transaction.Amount.currency)
            : '';

        this.state = {
            loanBrokerObject: undefined,
            vaultObject: undefined,
            editableAmount: !props.transaction.Amount?.value,
            depositAmount: props.transaction.Amount?.value,
            currencyName,
        };

        this.amountInput = React.createRef();
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
        const { depositAmount } = this.state;

        LedgerService.getLedgerEntry({ index: vaultId })
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
                }
            })
            .catch(() => {
                // Vault fetch failed, continue without vault info
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
        const { loanBrokerObject, vaultObject, editableAmount, currencyName, depositAmount } = this.state;

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

                {/* Deposit Amount */}
                <Text style={styles.label}>{Localize.t('loan.depositAmount')}</Text>
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
            </>
        );
    }
}

export default LoanBrokerCoverDepositTemplate;
