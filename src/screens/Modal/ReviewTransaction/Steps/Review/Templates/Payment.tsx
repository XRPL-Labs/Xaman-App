import BigNumber from 'bignumber.js';
import { isEmpty, isEqual, get } from 'lodash';
import React, { Component } from 'react';
import { View, Alert, Text, TouchableOpacity, InteractionManager } from 'react-native';

import { BackendService, LedgerService, StyleService } from '@services';

import { CoreRepository } from '@store/repositories';

import LedgerExchange, { MarketDirection } from '@common/libs/ledger/exchange';
import { Payment } from '@common/libs/ledger/transactions';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';
import { PathOption } from '@common/libs/ledger/types';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { AmountInput, AmountText, Button, InfoMessage, Spacer } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { RecipientElement, PathFindingPicker } from '@components/Modules';

import { Toast } from '@common/helpers/interface';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    isPathFinding: boolean;
    transaction: Payment;
    canOverride: boolean;
    forceRender: () => void;
}

export interface State {
    account: string;
    isLoading: boolean;
    amount: string;
    currencyName: string;
    editableAmount: boolean;
    destinationDetails: AccountNameType;
    isPartialPayment: boolean;
    shouldCheckForConversation: boolean;
    exchangeRate: number;
    xrpRoundedUp: string;
    currencyRate: any;
    isLoadingRate: boolean;
    shouldShowIssuerFee: boolean;
    isLoadingIssuerFee: boolean;
    issuerFee: number;
    selectedPath: PathOption;
}

/* Component ==================================================================== */
class PaymentTemplate extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;

    constructor(props: Props) {
        super(props);

        const { transaction } = props;

        this.state = {
            account: undefined,
            isLoading: false,
            editableAmount: !transaction.Amount?.value,
            amount: transaction.Amount?.value,
            currencyName: transaction.Amount?.currency ? NormalizeCurrencyCode(transaction.Amount.currency) : 'XRP',
            destinationDetails: undefined,
            isPartialPayment: false,
            // shouldCheckForConversation: !transaction.SendMax && props.canOverride,
            shouldCheckForConversation: !transaction.SendMax && props.canOverride && !props.isPathFinding,
            exchangeRate: undefined,
            xrpRoundedUp: undefined,
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
        // fetch the destination name e
        this.fetchDestinationInfo();

        // Payload payment request in IOU amount: handle conversion if required:
        this.checkForPartialPaymentRequired();

        // if XRP then show equal amount in selected currency
        this.fetchCurrencyRate();

        // check issuer fee if IOU payment
        this.fetchIssuerFee();
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (nextProps.transaction.Account?.address !== prevState.account) {
            return { account: nextProps.transaction.Account.address };
        }
        return null;
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        const { account } = this.state;

        if (!isEqual(prevState.account, account)) {
            InteractionManager.runAfterInteractions(this.checkForPartialPaymentRequired);
        }
    }

    fetchIssuerFee = () => {
        const { transaction } = this.props;
        const { account } = this.state;

        const issuer = transaction.SendMax?.issuer || transaction.Amount?.issuer;

        // ignore if not sending IOU or sender is issuer or Destination is issuer
        if (!issuer || account === issuer || transaction.Destination?.address === issuer) {
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

        // only for XRP payments
        if (transaction.Amount && transaction.Amount.currency !== 'XRP') {
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

    checkForPartialPaymentRequired = async () => {
        const { transaction, forceRender } = this.props;
        const { account, shouldCheckForConversation } = this.state;

        // only check if IOU
        if (!account || !transaction.Amount || transaction.Amount?.currency === 'XRP' || !shouldCheckForConversation) {
            return;
        }

        try {
            // get source trust lines
            const sourceLine = await LedgerService.getFilteredAccountLine(
                transaction.Account.address,
                transaction.Amount,
            );

            // if this condition applies we try to pay the requested amount with XRP
            // 1) the source account doesn't have the trustline or proper trustline
            // 2) the source account balance doesn't cover the entire requested amount
            // 3) the sender is not issuer
            const shouldPayWithXRP =
                (!sourceLine ||
                    (Number(sourceLine.limit) === 0 && Number(sourceLine.balance) === 0) ||
                    Number(sourceLine.balance) < Number(transaction.Amount.value)) &&
                account !== transaction.Amount.issuer;

            // if not have the same trust line or the balance is not covering requested value
            // Pay with XRP instead
            if (shouldPayWithXRP) {
                const PAIR = { issuer: transaction.Amount.issuer, currency: transaction.Amount.currency };

                const ledgerExchange = new LedgerExchange(PAIR);
                // sync with latest order book
                await ledgerExchange.initialize(MarketDirection.BUY);

                // get liquidity grade
                const liquidity = await ledgerExchange.getLiquidity(
                    MarketDirection.BUY,
                    Number(transaction.Amount.value),
                );

                // not enough liquidity
                if (!liquidity || !liquidity.safe || liquidity.errors.length > 0) {
                    this.setState({
                        isPartialPayment: true,
                        exchangeRate: 0,
                    });
                    return;
                }

                const sendMaxXRP = new BigNumber(transaction.Amount.value)
                    .multipliedBy(liquidity.rate)
                    .multipliedBy(1.04)
                    .decimalPlaces(8)
                    .toString(10);

                // @ts-ignore
                transaction.SendMax = sendMaxXRP;

                if (get(transaction.Flags, 'PartialPayment', false) === false) {
                    transaction.Flags = [txFlags.Payment.PartialPayment];
                    // force re-render the parent
                    forceRender();
                }

                this.setState({
                    isPartialPayment: true,
                    exchangeRate: new BigNumber(1).dividedBy(liquidity.rate).decimalPlaces(8).toNumber(),
                    xrpRoundedUp: sendMaxXRP,
                });
            } else {
                // check for transfer fee
                // if issuer have transfer fee add PartialPayment if not present
                // TODO: this is developer responsibility to add this flag in the first place
                const issuerFee = await LedgerService.getAccountTransferRate(transaction.Amount.issuer);

                // if issuer have fee and Source/Destination is not issuer set Partial Payment flag
                if (
                    issuerFee &&
                    transaction.Account.address !== transaction.Amount.issuer &&
                    transaction.Destination.address !== transaction.Amount.issuer &&
                    get(transaction.Flags, 'PartialPayment', false) === false
                ) {
                    transaction.Flags = [txFlags.Payment.PartialPayment];
                    // force re-render the parent
                    forceRender();
                }

                // if we already set the SendMax remove it
                if (transaction.SendMax) {
                    transaction.SendMax = undefined;
                }

                this.setState({
                    isPartialPayment: false,
                });
            }
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('payload.unableToCheckAssetConversion'));
        }
    };

    fetchDestinationInfo = () => {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        // fetch destination details
        getAccountName(transaction.Destination.address, transaction.Destination.tag)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        destinationDetails: res,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    onAmountChange = (amount: string) => {
        const { transaction } = this.props;

        this.setState({
            amount,
        });

        if (amount) {
            if (!transaction.Amount || transaction.Amount.currency === 'XRP') {
                // @ts-ignore
                transaction.Amount = amount;
            } else {
                const payAmount = { ...transaction.Amount };
                Object.assign(payAmount, { value: amount });
                transaction.Amount = payAmount;
            }
        }
    };

    onPathSelect = (path: PathOption) => {
        const { transaction } = this.props;

        if (path) {
            transaction.SendMax = path.source_amount;
            if (path.paths_computed.length === 0) {
                transaction.Paths = undefined;
            } else {
                transaction.Paths = path.paths_computed;
            }
        } else {
            transaction.SendMax = undefined;
            transaction.Paths = undefined;
        }

        this.setState({
            selectedPath: path,
        });
    };

    renderAmountRate = () => {
        const { amount, isLoadingRate, currencyRate } = this.state;

        if (isLoadingRate) {
            return (
                <View style={[styles.rateContainer]}>
                    <Text style={styles.rateText}>Loading ...</Text>
                </View>
            );
        }

        // only show rate for XRP
        if (currencyRate && amount) {
            const rate = Number(amount) * currencyRate.lastRate;
            if (rate > 0) {
                return (
                    <View style={[styles.rateContainer]}>
                        <Text style={styles.rateText}>
                            ~{currencyRate.code} {Localize.formatNumber(rate)}
                        </Text>
                    </View>
                );
            }
        }

        return null;
    };

    render() {
        const { transaction, isPathFinding } = this.props;
        const {
            account,
            isLoading,
            isPartialPayment,
            exchangeRate,
            xrpRoundedUp,
            editableAmount,
            amount,
            currencyName,
            destinationDetails,
            shouldShowIssuerFee,
            isLoadingIssuerFee,
            issuerFee,
            selectedPath,
        } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>

                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    recipient={{
                        address: transaction.Destination.address,
                        tag: transaction.Destination.tag,
                        ...destinationDetails,
                    }}
                />

                {/* Amount */}
                <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>

                <View style={[styles.contentBox]}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={[AppStyles.row]}
                        onPress={() => {
                            if (editableAmount && this.amountInput) {
                                this.amountInput.current?.focus();
                            }
                        }}
                    >
                        {editableAmount ? (
                            <>
                                <View style={[AppStyles.row, AppStyles.flex1]}>
                                    <AmountInput
                                        ref={this.amountInput}
                                        valueType={currencyName === 'XRP' ? AmountValueType.XRP : AmountValueType.IOU}
                                        onChange={this.onAmountChange}
                                        style={[styles.amountInput]}
                                        value={amount}
                                        editable={editableAmount}
                                        placeholderTextColor={StyleService.value('$textSecondary')}
                                    />
                                    <Text style={[styles.amountInput]}> {currencyName}</Text>
                                </View>
                                <Button
                                    onPress={() => {
                                        if (this.amountInput) {
                                            this.amountInput.current?.focus();
                                        }
                                    }}
                                    style={styles.editButton}
                                    roundedSmall
                                    icon="IconEdit"
                                    iconSize={13}
                                    light
                                />
                            </>
                        ) : (
                            <AmountText
                                value={amount}
                                currency={transaction.Amount.currency}
                                style={styles.amountInput}
                                immutable
                            />
                        )}
                    </TouchableOpacity>
                    {isPartialPayment &&
                        (exchangeRate ? (
                            <>
                                <Spacer size={15} />
                                <InfoMessage
                                    label={Localize.t('payload.payingWithXRPExchangeRate', {
                                        xrpRoundedUp,
                                        exchangeRate,
                                    })}
                                    type="info"
                                />
                            </>
                        ) : (
                            <>
                                <Spacer size={15} />
                                <InfoMessage
                                    label={Localize.t('payload.notEnoughLiquidityToSendThisPayment')}
                                    type="error"
                                />
                            </>
                        ))}

                    {this.renderAmountRate()}
                </View>

                {transaction.SendMax && !isPartialPayment && !selectedPath && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.sendMax')}</Text>
                        <View style={[styles.contentBox]}>
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
                        <Text style={[styles.label]}>{Localize.t('global.deliverMin')}</Text>
                        <View style={[styles.contentBox]}>
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
                        <Text style={[styles.label]}>{Localize.t('global.issuerFee')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{isLoadingIssuerFee ? 'Loading...' : `${issuerFee}%`}</Text>
                        </View>
                    </>
                )}

                {transaction.InvoiceID && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.invoiceID')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={styles.value}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}

                {isPathFinding && (
                    <>
                        <Text style={[styles.label]}>Pay with</Text>
                        <PathFindingPicker
                            source={account}
                            destination={transaction.Destination.address}
                            amount={transaction.Amount}
                            onSelect={this.onPathSelect}
                        />
                    </>
                )}
            </>
        );
    }
}

export default PaymentTemplate;
