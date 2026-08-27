import { get, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Alert, InteractionManager } from 'react-native';

import { LedgerService, NetworkService, StyleService } from '@services';

import { LoanPay } from '@common/libs/ledger/transactions';
import { Loan, LoanBroker, Vault } from '@common/libs/ledger/objects';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AmountInput, AmountText, Button, InfoMessage } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: LoanPay;
}

export interface State {
    loanObject?: Loan;
    loanBrokerObject?: LoanBroker;
    vaultObject?: Vault;
    paymentAmount?: string;
    editableAmount: boolean;
    currencyName: string;
}

/* Component ==================================================================== */
class LoanPayTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        const currencyName = props.transaction.Amount?.currency
            ? NormalizeCurrencyCode(props.transaction.Amount.currency)
            : '';

        this.state = {
            loanObject: undefined,
            loanBrokerObject: undefined,
            vaultObject: undefined,
            editableAmount: !props.transaction.Amount?.value,
            paymentAmount: props.transaction.Amount?.value,
            currencyName,
        };

        this.amountInput = React.createRef();
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

                    // Fetch the vault to get asset info
                    if (loanBrokerObject.VaultID) {
                        this.fetchVaultObject(loanBrokerObject.VaultID);
                    }
                }
            })
            .catch(() => {
                // LoanBroker fetch failed, continue without it
            });
    };

    fetchVaultObject = (vaultId: string) => {
        const { paymentAmount } = this.state;

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
                    if (!paymentAmount && vaultObject.Asset) {
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
            paymentAmount: amount,
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

    renderPaymentTypeInfo = () => {
        const { transaction } = this.props;

        if (transaction.isFullPayment) {
            return (
                <InfoMessage
                    type="info"
                    label={Localize.t('loan.fullPaymentExplain')}
                    containerStyle={AppStyles.marginBottomSml}
                />
            );
        }

        if (transaction.isOverpayment) {
            return (
                <InfoMessage
                    type="info"
                    label={Localize.t('loan.overpaymentExplain')}
                    containerStyle={AppStyles.marginBottomSml}
                />
            );
        }

        return null;
    };

    renderPaymentTypeLabel = (): string => {
        const { transaction } = this.props;

        if (transaction.isFullPayment) {
            return Localize.t('loan.paymentTypeFull');
        }
        if (transaction.isOverpayment) {
            return Localize.t('loan.paymentTypeOverpayment');
        }

        return Localize.t('loan.paymentTypeRegular');
    };

    render() {
        const { transaction } = this.props;
        const { loanObject, loanBrokerObject, editableAmount, currencyName, paymentAmount } = this.state;

        return (
            <>
                {this.renderPaymentTypeInfo()}

                <Text style={styles.label}>{Localize.t('loan.paymentType')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{this.renderPaymentTypeLabel()}</Text>
                </View>

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

                        {loanObject.PeriodicPayment && (
                            <>
                                <Text style={styles.label}>{Localize.t('loan.periodicPayment')}</Text>
                                <View style={styles.contentBox}>
                                    <AmountText
                                        value={loanObject.PeriodicPayment}
                                        style={styles.value}
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

                {/* Payment Amount */}
                <Text style={styles.label}>{Localize.t('loan.paymentAmount')}</Text>
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
                                        value={paymentAmount}
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
                                value={paymentAmount!}
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

export default LoanPayTemplate;
