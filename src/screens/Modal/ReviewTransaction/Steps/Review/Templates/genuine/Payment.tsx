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

import { AmountInput, AmountText, Button, InfoMessage } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountElement, MPTWidget, PaymentOptionsPicker } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
import { DecodeMPTokenIssuanceToIssuer } from '@common/utils/codec';
import { MPToken, MPTokenIssuance } from '@common/libs/ledger/objects';
import { ComponentTypes } from '@services/NavigationService';

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
    mptDetails?: MPToken;
    mptIssuanceDetails?: MPTokenIssuance;
    mptIssuanceError?: { error: string };
}

/* Component ==================================================================== */
class PaymentTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    private currentCurrency: TrustLineModel | undefined;

    constructor(props: Props) {
        super(props);
        const { source } = this.props;

        const { transaction } = props;

        // console.log('transactiontransaction', transaction)

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
            editableAmount: !transaction.Amount?.value || transaction.Amount?.value === '0',
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
            mptDetails: undefined,
            mptIssuanceDetails: undefined,
        };

        this.amountInput = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            // if native currency then show equal amount in selected currency
            this.fetchCurrencyRate();

            // check issuer fee if IOU payment
            this.fetchIssuerFee();

            // fetch mpt details
            this.fetchMPTDetails();

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

    isMPTAmount = () => {
        const { transaction } = this.props;
        return transaction?.Amount &&
            typeof transaction?.Amount !== 'string' &&
            transaction.Amount?.mpt_issuance_id && 
            String(transaction.Amount.mpt_issuance_id).length === 48;
    };

    fetchMPTDetails = async () => {
        const { transaction } = this.props;
        const { account } = this.state;

        if (this.isMPTAmount()) {
            const [issuance, mpt] = await Promise.all([
                LedgerService.getLedgerEntry({
                    command: 'ledger_entry',
                    mpt_issuance: transaction?.Amount?.mpt_issuance_id,
                }),
                LedgerService.getLedgerEntry({
                    command: 'ledger_entry',
                    mptoken: {
                        mpt_issuance_id: transaction?.Amount?.mpt_issuance_id,
                        account,
                    },
                }),
            ]);

            if ((mpt as any)?.node) {
                this.setState({
                    mptDetails: (mpt as any).node as MPToken,
                });
            }

            if ((issuance as any)?.node) {
                this.setState({
                    mptIssuanceDetails: (issuance as any).node as MPTokenIssuance,
                });
            } else if ((issuance as any)?.error) {
                this.setState({
                    mptIssuanceError: issuance as any,
                });
            }

            this.setIsReady();
        }
    };

    setIsReady = () => {
        const { payload, setReady } = this.props;
        const { mptIssuanceDetails } = this.state;

        // disable ready until user selects a payment option
        if (payload.isPathFinding()) {
            setReady(false);
        }

        if (this.isMPTAmount()) {
            if (mptIssuanceDetails) {                
                setReady(true);
            } else {
                setReady(false);
            }
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
                // Alert.alert(
                //     Localize.t('global.warning'),
                //     Localize.t('global.unableToFetchCurrencyRate'),
                //     [
                //         { text: Localize.t('global.ok') },
                //     ],
                // );
            });
    };

    onAmountChange = (amount: string) => {
        const {
            transaction,
            forceRender,
        } = this.props;

        this.setState({
            amount,
        });

        if (amount) {
            if (!transaction.Amount || transaction.Amount.currency === NetworkService.getNativeAsset()) {
                transaction.Amount = {
                    currency: NetworkService.getNativeAsset(),
                    value: amount,
                };
                if (typeof forceRender === 'function') {
                    forceRender();
                }
            } else {
                const payAmount = { ...transaction.Amount };
                Object.assign(payAmount, { value: amount });
                transaction.Amount = payAmount;
                if (typeof forceRender === 'function') {
                    forceRender();
                }
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
                transaction.SendMax = 'currency' in path.source_amount
                    ? path.source_amount
                    : undefined;
            }
            // SendMax is not allowed for native to native
            if (
                transaction.SendMax?.currency === NetworkService.getNativeAsset() &&
                transaction.Amount?.currency === NetworkService.getNativeAsset()
            ) {
                transaction.SendMax = undefined;
                // If native asset and destination is native asset it can't be partial
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

        if (editableAmount && !this.isMPTAmount()) {
            this.amountInput?.current?.focus();
        }
    };


    renderAmountRate = () => {
        const {
            amount,
            isLoadingRate,
            currencyRate,
            currencyName,
        } = this.state;

        if (isLoadingRate) {
            return (
                <View style={styles.rateContainer}>
                    <Text style={styles.rateText}>Loading ...</Text>
                </View>
            );
        }

        // only show rate for native asset
        if (currencyRate && (amount || currencyName === NetworkService.getNativeAsset())) {
            const rate = Number(amount || 1) * currencyRate.rate;
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
            mptDetails,
            mptIssuanceDetails,
            mptIssuanceError,
        } = this.state;

        const mptAmount = {
            holding: 0,
            transaction: 0,
            availableForIssuance: 0,
        };

        if (this.isMPTAmount()) {
            mptAmount.holding = Number(mptDetails?.MPTAmount || 0);
            mptAmount.transaction = Number(transaction?.Amount?.value || 0);

            mptAmount.availableForIssuance = Number(mptIssuanceDetails?.MaximumAmount || 0) -
                Number(mptIssuanceDetails?.OutstandingAmount || 0);

            if ((mptIssuanceDetails?.AssetScale || 1) > 1) {
                mptAmount.holding /= 10 ** (mptIssuanceDetails?.AssetScale || 1);
                mptAmount.transaction /= 10 ** (mptIssuanceDetails?.AssetScale || 1);
                mptAmount.availableForIssuance /= 10 ** (mptIssuanceDetails?.AssetScale || 1);
            }

            if (!mptIssuanceDetails && !mptIssuanceError) {
                return (
                    <>
                        <Text style={styles.label}>{Localize.t('mptoken.event')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{Localize.t('mptoken.loading')}</Text>
                        </View>
                    </>
                );
            }

            if (!mptIssuanceDetails && mptIssuanceError) {
                return (
                    <>
                        <Text style={styles.label}>{Localize.t('mptoken.event')}</Text>
                        <InfoMessage
                            type="error"
                            label={`${Localize.t('mptoken.errorLoading')}${mptIssuanceError?.error ? `\n"${mptIssuanceError?.error}"` : ''}`}
                            containerStyle={AppStyles.marginBottomSml}
                        />
                    </>
                );
            }
        }

        const isNativeAsset = (currencyRate && amount) ||
            (currencyRate && !this.isMPTAmount() && currencyName === NetworkService.getNativeAsset());

        // TODO: better handling this part
        if (!account) {
            return null;
        }
    
        return (
            <>
                {transaction.Amount?.mpt_issuance_id && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.issuer')}
                            </Text>
                        </View>

                        <AccountElement
                            address={DecodeMPTokenIssuanceToIssuer(transaction.Amount.mpt_issuance_id)}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

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
                    <View style={[
                        styles.contentBox,
                        // AppStyles.borderGreen,
                    ]}>
                        <TouchableOpacity activeOpacity={1} style={[
                            AppStyles.row,
                            // AppStyles.borderRed,
                        ]} onPress={this.onAmountEditPress}>
                            {editableAmount && !this.isMPTAmount() ? (
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
                                        style={[
                                            // styles.editButton,
                                        ]}
                                        roundedMini
                                        icon="IconEdit"
                                        iconSize={13}
                                        light
                                    />
                                </>
                            ) : (
                                <View>
                                    <AmountText
                                        value={this.isMPTAmount() ? mptAmount.transaction : amount!}
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
                            <View style={[
                                AppStyles.flex1,
                                AppStyles.flexStart,
                            ]}>{this.renderAmountRate()}</View>
                            <View style={[AppStyles.flex2, AppStyles.flexEnd]}>
                                <Text style={[
                                    !isNativeAsset
                                        ? AppStyles.textLeftAligned
                                        : AppStyles.textRightAligned,
                                    SummaryStepStyle.currencyBalance,
                                ]}>
                                    {Localize.t('global.available')}{': '}
                                    {
                                        !isNativeAsset && !this.isMPTAmount()
                                            ? <AmountText
                                                value={
                                                    Math.floor(
                                                        Number(this.currentCurrency?.balance || 0) * 100_000_000,
                                                    ) / 100_000_000
                                                }
                                                style={[AppStyles.monoBold]}
                                                currency={this.currentCurrency?.getFormattedCurrency()}
                                                immutable
                                            />
                                            : this.isMPTAmount() ? (
                                                <Text style={[AppStyles.monoBold]}>
                                                    {
                                                        source.address === mptIssuanceDetails?.Issuer
                                                            ? (
                                                                (mptIssuanceDetails?.MaximumAmount || 0) > 0
                                                                    ? mptAmount.availableForIssuance
                                                                    : 'N/A (issuer)'
                                                            )
                                                            : mptAmount.holding
                                                    }{' '}
                                                </Text>
                                            ) : (
                                                <Text style={[AppStyles.monoBold]}>
                                                    {Localize.formatNumber(CalculateAvailableBalance(source!))}{' '}
                                                    {NetworkService.getNativeAsset()}
                                                </Text>
                                            )
                                    }
                                </Text>
                            </View>
                        </View>
                    </View>
                </>

                {this.isMPTAmount() && (
                    <>
                        <Text style={[
                            styles.label,
                            AppStyles.marginTopSml,
                        ]}>{Localize.t('mptokenIssuance.explainerTitle')}</Text>
                        <MPTWidget
                            isPaymentScreen
                            labelStyle={[styles.label, styles.labelSmall]}
                            contentStyle={[
                                styles.contentBox,
                                styles.value,
                                styles.valueSmall,
                            ]}
                            item={mptIssuanceDetails!}
                            account={source}
                            componentType={ComponentTypes.Unknown}
                        />
                    </>
                )}

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

                {payload.isPathFinding() && transaction.Amount! && transaction.Amount?.value && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.payWith')}</Text>
                        <PaymentOptionsPicker
                            key={`dpick${account}${transaction.Destination}${JSON.stringify(transaction.Amount!)}`}
                            source={account}
                            destination={transaction.Destination}
                            // TODO: make sure the Amount is set as it's required for payment options
                            amount={transaction.Amount!}
                            containerStyle={AppStyles.paddingBottomSml}
                            onSelect={this.onPathSelect}
                        />
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

                {transaction.DomainID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.domainID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.DomainID}</Text>
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
            </>
        );
    }
}

export default PaymentTemplate;
