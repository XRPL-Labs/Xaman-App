import BigNumber from 'bignumber.js';
import { isEmpty, isEqual } from 'lodash';
import React, { Component } from 'react';
import {
    View,
    TextInput,
    Text,
    ActivityIndicator,
    Platform,
    TouchableOpacity,
    KeyboardAvoidingView,
    InteractionManager,
} from 'react-native';

import LedgerExchange from '@common/libs/ledger/exchange';
import { Payment } from '@common/libs/ledger/transactions';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { LedgerService } from '@services';
import { NormalizeAmount } from '@common/libs/utils';
import { getAccountName } from '@common/helpers/resolver';

import { Button, InfoMessage, Spacer } from '@components';

import Localize from '@locale';

import { AppStyles, AppColors } from '@theme';
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
    destinationName: string;
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
            destinationName: '',
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
        const { isPartialPayment } = this.state;

        if (transaction.Amount && transaction.Amount.currency !== 'XRP') {
            // get source trust lines
            const sourceLines = await LedgerService.getAccountLines(transaction.Account.address);

            const { lines } = sourceLines;

            const trustLine = lines.filter(
                (l: any) => l.currency === transaction.Amount.currency && l.account === transaction.Amount.issuer,
            )[0];

            if (!trustLine || parseFloat(trustLine.balance) < parseFloat(transaction.Amount.value)) {
                if (isPartialPayment) return;

                const PAIR = { issuer: transaction.Amount.issuer, currency: transaction.Amount.currency };

                const ledgerExchange = new LedgerExchange(PAIR);
                // sync with latest order book
                await ledgerExchange.sync();

                // get liquidity grade
                const liquidityGrade = ledgerExchange.liquidityGrade('buy');

                // not enough liquidity
                if (liquidityGrade === 0) {
                    this.setState({
                        isPartialPayment: true,
                        exchangeRate: 0,
                    });
                    return;
                }

                const exchangeRate = ledgerExchange.getExchangeRate('buy');
                const sendMaxXRP = new BigNumber(transaction.Amount.value).dividedBy(exchangeRate).decimalPlaces(6);

                // @ts-ignore
                transaction.SendMax = sendMaxXRP.toString();
                transaction.Flags = [txFlags.Payment.PartialPayment];

                this.setState({
                    isPartialPayment: true,
                    exchangeRate,
                    xrpRoundedUp: sendMaxXRP.toString(),
                });
            } else if (isPartialPayment) {
                if (transaction.SendMax) {
                    transaction.SendMax = undefined;
                }
                this.setState({
                    isPartialPayment: false,
                });
            }
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
                        destinationName: res.name,
                    });
                }
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
            destinationName,
        } = this.state;
        return (
            <KeyboardAvoidingView keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0} behavior="position">
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.to')}:
                    </Text>
                </View>
                <View style={[styles.contentBox, styles.addressContainer]}>
                    <Text style={[AppStyles.pbold]}>
                        {isLoading ? (
                            Platform.OS === 'ios' ? (
                                <ActivityIndicator color={AppColors.blue} />
                            ) : (
                                'Loading...'
                            )
                        ) : (
                            destinationName || Localize.t('global.unknown')
                        )}
                    </Text>
                    <Text selectable numberOfLines={1} style={[AppStyles.monoSubText, AppStyles.colorGreyDark]}>
                        {transaction.Destination.address}
                    </Text>
                    {transaction.Destination.tag && (
                        <View style={[styles.destinationAddress]}>
                            <Text style={[AppStyles.monoSubText, AppStyles.colorGreyDark]}>
                                {Localize.t('global.destinationTag')}:{' '}
                                <Text style={AppStyles.colorBlue}>{transaction.Destination.tag}</Text>
                            </Text>
                        </View>
                    )}
                </View>

                {/* Amount */}
                <Text style={[styles.label]}>{Localize.t('global.amount')}:</Text>

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
                                ref={r => {
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
                                {transaction.Amount?.currency ? transaction.Amount.currency : 'XRP'}
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
                                    label={Localize.t('payload.notEnoughtLiquidityToSendThisPayment')}
                                    type="error"
                                />
                            </>
                        ))}
                </View>

                {transaction.invoiceID && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.invoiceID')}:</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={styles.value}>{transaction.invoiceID}</Text>
                        </View>
                    </>
                )}
            </KeyboardAvoidingView>
        );
    }
}

export default PaymentTemplate;
