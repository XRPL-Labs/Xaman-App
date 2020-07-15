import BigNumber from 'bignumber.js';
import { isEmpty, isEqual, has } from 'lodash';
import React, { Component } from 'react';
import { View, Alert, TextInput, Text, Platform, TouchableOpacity, InteractionManager } from 'react-native';

import LedgerExchange from '@common/libs/ledger/exchange';
import { Payment } from '@common/libs/ledger/transactions';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { LedgerService } from '@services';
import { NormalizeAmount, NormalizeCurrencyCode } from '@common/libs/utils';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { Button, InfoMessage, Spacer } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: Payment;
}

export interface State {
    account: string;
    isLoading: boolean;
    amount: string;
    editableAmount: boolean;
    destinationDetails: AccountNameType;
    isPartialPayment: boolean;
    exchangeRate: number;
    xrpRoundedUp: string;
}

/* Component ==================================================================== */
class PaymentTemplate extends Component<Props, State> {
    amountInput: TextInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            account: undefined,
            isLoading: false,
            editableAmount: !props.transaction.Amount?.value,
            amount: props.transaction.Amount?.value,
            destinationDetails: { name: '', source: '' },
            isPartialPayment: false,
            exchangeRate: undefined,
            xrpRoundedUp: undefined,
        };
    }

    componentDidMount() {
        // fetch the destination name e
        this.fetchDestinationInfo();

        // Payload payment request in IOU amount: handle conversion if required:
        this.checkForConversationRequired();
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
            InteractionManager.runAfterInteractions(() => {
                this.checkForConversationRequired();
            });
        }
    }

    checkForConversationRequired = async () => {
        const { transaction } = this.props;
        const { account } = this.state;

        if (!account) return;

        try {
            if (transaction.Amount && transaction.Amount.currency !== 'XRP') {
                // get source trust lines
                const sourceLines = await LedgerService.getAccountLines(transaction.Account.address);

                const { lines } = sourceLines;

                const trustLine = lines.filter(
                    (l: any) => l.currency === transaction.Amount.currency && l.account === transaction.Amount.issuer,
                )[0];

                let shouldPayWithXRP =
                    !trustLine ||
                    (parseFloat(trustLine.balance) < parseFloat(transaction.Amount.value) &&
                        account !== transaction.Amount.issuer);

                // just ignore if the sender is the issuer
                if (account === transaction.Amount.issuer) {
                    shouldPayWithXRP = false;
                }

                // if not have the same trust line or the balance is not covering requested value
                // Pay with XRP instead
                if (shouldPayWithXRP) {
                    const PAIR = { issuer: transaction.Amount.issuer, currency: transaction.Amount.currency };

                    const ledgerExchange = new LedgerExchange(PAIR);
                    // sync with latest order book
                    await ledgerExchange.initialize();

                    // get liquidity grade
                    const liquidity = await ledgerExchange.getLiquidity('buy', Number(transaction.Amount.value));

                    // not enough liquidity
                    if (!liquidity.safe || liquidity.errors.length > 0) {
                        this.setState({
                            isPartialPayment: true,
                            exchangeRate: 0,
                        });
                        return;
                    }

                    const sendMaxXRP = new BigNumber(transaction.Amount.value)
                        .multipliedBy(liquidity.rate)
                        .decimalPlaces(6)
                        .toString(10);

                    // @ts-ignore
                    transaction.SendMax = sendMaxXRP;
                    transaction.Flags = [txFlags.Payment.PartialPayment];

                    this.setState({
                        isPartialPayment: true,
                        exchangeRate: new BigNumber(1).dividedBy(liquidity.rate).decimalPlaces(6).toNumber(),
                        xrpRoundedUp: sendMaxXRP,
                    });
                } else {
                    // check for transfer fee
                    // add PartialPayment
                    const issuerAccountInfo = await LedgerService.getAccountInfo(trustLine.account);
                    if (has(issuerAccountInfo, ['account_data', 'TransferRate']) || account === trustLine.account) {
                        transaction.Flags = [txFlags.Payment.PartialPayment];
                    }

                    if (transaction.SendMax) {
                        transaction.SendMax = undefined;
                    }
                    this.setState({
                        isPartialPayment: false,
                    });
                }
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
        getAccountName(transaction.Destination.address)
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

        const sendAmount = NormalizeAmount(amount);

        this.setState({
            amount: sendAmount,
        });

        if (sendAmount) {
            if (!transaction.Amount || transaction.Amount.currency === 'XRP') {
                // @ts-ignore
                transaction.Amount = sendAmount;
            } else {
                const payAmount = { ...transaction.Amount };
                Object.assign(payAmount, { value: sendAmount });
                transaction.Amount = payAmount;
            }
        }
    };

    render() {
        const { transaction } = this.props;
        const {
            isLoading,
            isPartialPayment,
            exchangeRate,
            xrpRoundedUp,
            editableAmount,
            amount,
            destinationDetails,
        } = this.state;
        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.to')}
                    </Text>
                </View>

                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    showAvatar={false}
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
                                this.amountInput.focus();
                            }
                        }}
                    >
                        <View style={[AppStyles.row, AppStyles.flex1]}>
                            <TextInput
                                ref={(r) => {
                                    this.amountInput = r;
                                }}
                                keyboardType="decimal-pad"
                                autoCapitalize="words"
                                onChangeText={this.onAmountChange}
                                returnKeyType="done"
                                placeholder="0"
                                style={[styles.amountInput]}
                                value={amount}
                                editable={editableAmount}
                            />
                            <Text style={[styles.amountInput]}>
                                {' '}
                                {transaction.Amount?.currency
                                    ? NormalizeCurrencyCode(transaction.Amount.currency)
                                    : 'XRP'}
                            </Text>
                        </View>
                        {editableAmount && (
                            <Button
                                onPress={() => {
                                    if (this.amountInput) {
                                        this.amountInput.focus();
                                    }
                                }}
                                style={styles.editButton}
                                roundedSmall
                                iconSize={13}
                                light
                                icon="IconEdit"
                            />
                        )}
                    </TouchableOpacity>
                    {isPartialPayment &&
                        (exchangeRate ? (
                            <>
                                <Spacer size={Platform.OS === 'ios' ? 15 : 0} />
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
                                <Spacer size={Platform.OS === 'ios' ? 15 : 0} />
                                <InfoMessage
                                    label={Localize.t('payload.notEnoughLiquidityToSendThisPayment')}
                                    type="error"
                                />
                            </>
                        ))}
                </View>

                {transaction.InvoiceID && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.invoiceID')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={styles.value}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default PaymentTemplate;
