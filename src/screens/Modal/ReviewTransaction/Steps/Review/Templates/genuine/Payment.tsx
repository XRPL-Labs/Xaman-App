import React, { Component } from 'react';
import { View, Text, TouchableOpacity, InteractionManager } from 'react-native';

import SummaryStepStyle from '@screens/Send/Steps/Summary/styles';
import { BackendService, LedgerService, NetworkService, StyleService } from '@services';
import { RatesType } from '@services/BackendService';

import { CoreRepository } from '@store/repositories';

import { Payment } from '@common/libs/ledger/transactions';
import { PathFindPathOption } from '@common/libs/ledger/types/methods';

import { CalculateAvailableBalance } from '@common/utils/balance';

import { TrustLineModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AmountInput, AmountText, Button } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountElement, PaymentOptionsPicker } from '@components/Modules';

import { Toast } from '@common/helpers/interface';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Payment;
}

export interface State {
    account?: string;
    amount?: string;
    currencyName: string;
    editableAmount: boolean;
    currencyRate?: RatesType;
    isLoadingRate: boolean;
    shouldShowIssuerFee: boolean;
    isLoadingIssuerFee: boolean;
    issuerFee: number;
    selectedPath?: PathFindPathOption;
}

/* Component ==================================================================== */
class PaymentTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    private currentCurrency: TrustLineModel | undefined;

    constructor(props: Props) {
        super(props);
        const { source } = this.props;

        const { transaction } = props;

        if (transaction.Amount?.currency && transaction.Amount?.issuer) {
            this.currentCurrency = (source?.lines || [])
                .filter(l => {
                    return l.currency.currencyCode === transaction.Amount?.currency &&
                        l.currency.issuer === transaction.Amount?.issuer;
                })?.[0];

            // console.log(this.currentCurrency?.balance);
            // console.log(this.currentCurrency?.getFormattedCurrency());
        };

        this.state = {
            account: undefined,
            editableAmount: !transaction.Amount?.value,
            amount: transaction.Amount?.value,
            currencyName: transaction.Amount?.currency
                ? NormalizeCurrencyCode(transaction.Amount.currency)
                : NetworkService.getNativeAsset(),
            currencyRate: undefined,
            isLoadingRate: false,
            shouldShowIssuerFee: false,
            isLoadingIssuerFee: false,
            issuerFee: 0,
            selectedPath: undefined,
        };

        this.amountInput = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            // if native currency then show equal amount in selected currency
            this.fetchCurrencyRate();

            // check issuer fee if IOU payment
            this.fetchIssuerFee();

            // set isReady to false if payment options are required
            this.setIsReady();
        });
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.source?.address !== prevState.account) {
            return { account: nextProps.source?.address };
        }
        return null;
    }

    setIsReady = () => {
        const { payload, setReady } = this.props;

        // disable ready until user selects a payment option
        if (payload.isPathFinding()) {
            setReady(false);
        }
    };

    fetchIssuerFee = () => {
        const { transaction } = this.props;
        const { account } = this.state;

        const issuer = transaction.SendMax?.issuer || transaction.Amount?.issuer;

        // ignore if not sending IOU or sender is issuer or Destination is issuer
        if (!issuer || account === issuer || transaction.Destination === issuer) {
            return;
        }

        this.setState({ isLoadingIssuerFee: true, shouldShowIssuerFee: true });

        // get transfer rate from issuer account
        LedgerService.getAccountTransferRate(issuer)
            .then((issuerFee) => {
                if (issuerFee) {
                    this.setState({
                        issuerFee,
                    });
                }
            })
            .catch(() => {
                this.setState({
                    shouldShowIssuerFee: false,
                });
            })
            .finally(() => {
                this.setState({
                    isLoadingIssuerFee: false,
                });
            });
    };

    fetchCurrencyRate = () => {
        const { transaction } = this.props;

        // only for native payments
        if (transaction.Amount && transaction.Amount.currency !== NetworkService.getNativeAsset()) {
            return;
        }

        this.setState({
            isLoadingRate: true,
        });

        const { currency } = CoreRepository.getSettings();

        BackendService.getCurrencyRate(currency)
            .then((r) => {
                this.setState({
                    currencyRate: r,
                    isLoadingRate: false,
                });
            })
            .catch(() => {
                this.setState({
                    isLoadingRate: false,
                });
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

    onAmountChange = (amount: string) => {
        const { transaction } = this.props;

        this.setState({
            amount,
        });

        if (amount) {
            if (!transaction.Amount || transaction.Amount.currency === NetworkService.getNativeAsset()) {
                transaction.Amount = {
                    currency: NetworkService.getNativeAsset(),
                    value: amount,
                };
            } else {
                const payAmount = { ...transaction.Amount };
                Object.assign(payAmount, { value: amount });
                transaction.Amount = payAmount;
            }
        }
    };

    onPathSelect = (path?: PathFindPathOption) => {
        const { transaction, setReady } = this.props;

        if (path) {
            if (typeof path.source_amount === 'string') {
                transaction.SendMax = {
                    currency: NetworkService.getNativeAsset(),
                    value: path.source_amount,
                };
            } else {
                transaction.SendMax = path.source_amount;
            }
            // SendMax is not allowed for native to native
            if (
                transaction.SendMax?.currency === NetworkService.getNativeAsset() &&
                transaction.Amount?.currency === NetworkService.getNativeAsset()
            ) {
                transaction.SendMax = undefined;
            }

            // set the transaction path
            if (path.paths_computed.length === 0) {
                transaction.Paths = undefined!;
            } else {
                transaction.Paths = path.paths_computed;
            }

            // user can continue signing the transaction
            setReady(true);
        } else {
            // clear any set value
            transaction.SendMax = undefined;
            transaction.Paths = undefined!;

            // user cannot continue
            setReady(false);
        }

        this.setState({
            selectedPath: path,
        });
    };

    onAmountEditPress = () => {
        const { editableAmount } = this.state;

        if (editableAmount) {
            this.amountInput?.current?.focus();
        }
    };


    renderAmountRate = () => {
        const { amount, isLoadingRate, currencyRate } = this.state;

        if (isLoadingRate) {
            return (
                <View style={styles.rateContainer}>
                    <Text style={styles.rateText}>Loading ...</Text>
                </View>
            );
        }

        // only show rate for native asset
        if (currencyRate && amount) {
            const rate = Number(amount) * currencyRate.rate;
            if (rate > 0) {
                return (
                    <View style={styles.rateContainer}>
                        <Text style={styles.rateText}>
                            ~{currencyRate.code} {Localize.formatNumber(rate, 2)}
                        </Text>
                    </View>
                );
            }
        }

        return null;
    };

    render() {
        const { transaction, payload, source } = this.props;
        const {
            account,
            editableAmount,
            amount,
            currencyName,
            shouldShowIssuerFee,
            isLoadingIssuerFee,
            issuerFee,
            selectedPath,
            currencyRate,
        } = this.state;

        const isNativeAsset = currencyRate && amount;

        // TODO: better handling this part
        if (!account) {
            return null;
        }

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>

                <AccountElement
                    address={transaction.Destination}
                    tag={transaction.DestinationTag}
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                />

                {/* Amount */}
                <>
                    <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                    <View style={styles.contentBox}>
                        <TouchableOpacity activeOpacity={1} style={AppStyles.row} onPress={this.onAmountEditPress}>
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
                                            value={amount}
                                            editable={editableAmount}
                                            placeholderTextColor={StyleService.value('$textSecondary')}
                                        />
                                        <Text style={styles.amountInput}> {currencyName}</Text>
                                    </View>
                                    <Button
                                        onPress={this.onAmountEditPress}
                                        style={styles.editButton}
                                        roundedSmall
                                        icon="IconEdit"
                                        iconSize={13}
                                        light
                                    />
                                </>
                            ) : (
                                <View>
                                    <AmountText
                                        value={amount!}
                                        currency={transaction.Amount?.currency}
                                        style={styles.amountInput}
                                        immutable
                                    />
                                </View>
                            )}
                        </TouchableOpacity>
                        {/* <!-- 
                            Todo: native shows equivalent = right
                            non native = show below
                        --> */}
                        <View style={[
                            !isNativeAsset
                                ? AppStyles.column
                                : AppStyles.row,
                            AppStyles.stretchSelf,
                        ]}>
                            <View style={[AppStyles.flex1, AppStyles.flexStart]}>{this.renderAmountRate()}</View>
                            <View style={[AppStyles.flex1, AppStyles.flexEnd]}>
                                <Text style={[
                                    !isNativeAsset
                                        ? AppStyles.textLeftAligned
                                        : AppStyles.textRightAligned,
                                    SummaryStepStyle.currencyBalance,
                                ]}>
                                    {Localize.t('global.available')}:{' '}
                                    {
                                        !isNativeAsset
                                            ? <AmountText
                                                value={
                                                    Math.floor(
                                                        Number(this.currentCurrency?.balance || 0) * 100_000_000,
                                                    ) / 100_000_000
                                                }
                                                currency={this.currentCurrency?.getFormattedCurrency()}
                                                immutable
                                            />    
                                            : <Text>
                                                {Localize.formatNumber(CalculateAvailableBalance(source!))}{' '}
                                                {NetworkService.getNativeAsset()}
                                            </Text>
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>
                </>

                {transaction.SendMax && !selectedPath && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.sendMax')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.SendMax.value}
                                currency={transaction.SendMax.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.DeliverMin && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.deliverMin')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.DeliverMin.value}
                                currency={transaction.DeliverMin.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {shouldShowIssuerFee && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.issuerFee')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{isLoadingIssuerFee ? 'Loading...' : `${issuerFee}%`}</Text>
                        </View>
                    </>
                )}

                {transaction.InvoiceID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.invoiceID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}

                {transaction.CredentialIDs && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.credentialIDs')}</Text>
                        <View style={styles.contentBox}>
                            {transaction.CredentialIDs.map((id, index) => (
                                <Text key={`credential-${index}`} style={styles.value}>
                                    {id}
                                </Text>
                            ))}
                        </View>
                    </>
                )}

                {payload.isPathFinding() && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.payWith')}</Text>
                        <PaymentOptionsPicker
                            source={account}
                            destination={transaction.Destination}
                            // TODO: make sure the Amount is set as it's required for payment options
                            amount={transaction.Amount!}
                            containerStyle={AppStyles.paddingBottomSml}
                            onSelect={this.onPathSelect}
                        />
                    </>
                )}
            </>
        );
    }
}

export default PaymentTemplate;
