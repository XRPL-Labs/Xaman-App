/**
 * Send Screen
 */

import { find, first } from 'lodash';

import React, { Component } from 'react';
import { View, Keyboard } from 'react-native';

import { AppScreens } from '@common/constants';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountModel, TrustLineModel } from '@store/models';

import NetworkService from '@services/NetworkService';

import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import Memo from '@common/libs/ledger/parser/common/memo';

import { AmountParser } from '@common/libs/ledger/parser/common';
import { Payment, PaymentValidation } from '@common/libs/ledger/transactions';
import { Destination } from '@common/libs/ledger/parser/types';
import { SignMixin } from '@common/libs/ledger/mixin';

// components
import { Header } from '@components/General';
import { NetworkLabel } from '@components/Modules';

// local
import Localize from '@locale';

// steps
import { DetailsStep, RecipientStep, SummaryStep, SubmittingStep, ResultStep } from './Steps';

// context
import { StepsContext } from './Context';

// style
import styles from './styles';

/* types ==================================================================== */
import { Steps, Props, State, FeeItem } from './types';

/* Component ==================================================================== */
class SendView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Payment;

    private closeTimeout: ReturnType<typeof setTimeout> | undefined;

    constructor(props: Props) {
        super(props);

        // default values
        const coreSettings = CoreRepository.getSettings();
        const spendableAccounts = AccountRepository.getSpendableAccounts();
        const PaymentWithSigMixin = SignMixin(Payment);

        this.state = {
            currentStep: Steps.Details,
            accounts: spendableAccounts,
            payment: new PaymentWithSigMixin(),
            source: find(spendableAccounts, { address: coreSettings.account.address }) ?? first(spendableAccounts),
            currency: props.currency || NetworkService.getNativeAsset(),
            amount: props.amount || '',
            memo: undefined,
            selectedFee: undefined,
            issuerFee: undefined,
            destination: undefined,
            destinationInfo: undefined,
            scanResult: props.scanResult ?? undefined,
            coreSettings,
            isLoading: false,
        };
    }

    componentDidMount() {
        const { accounts } = this.state;

        // go back if no spendable account is available
        if (accounts.length === 0) {
            this.closeTimeout = setTimeout(() => {
                Navigator.pop();
                Toast(Localize.t('global.noSpendableAccountIsAvailableForSendingPayment'));
            }, 1000);
        }
    }

    componentWillUnmount() {
        const { isLoading, payment } = this.state;

        if (this.closeTimeout) clearTimeout(this.closeTimeout);

        // abort the transaction if already running
        if (isLoading && payment) {
            payment.abort();
        }
    }

    setSource = (source: AccountModel) => {
        this.setState({ source });
    };

    setCurrency = (currency: TrustLineModel | string) => {
        this.setState({
            currency,
        });
    };

    setAmount = (amount: string) => {
        this.setState({ amount });
    };

    setFee = (selectedFee: FeeItem) => {
        this.setState({ selectedFee });
    };

    setIssuerFee = (issuerFee: number) => {
        this.setState({ issuerFee });
    };

    setDestination = (_destination: Destination | undefined) => {
        const { destination, destinationInfo } = this.state;

        this.setState({
            destination: _destination,
            destinationInfo: _destination?.address !== destination?.address ? undefined : destinationInfo,
        });
    };

    setDestinationInfo = (info: any) => {
        this.setState({ destinationInfo: info });
    };

    setMemo = (memo: string) => {
        this.setState({ memo });
    };

    setScanResult = (result: any) => {
        this.setState({ scanResult: result });
    };

    getPaymentJsonForFee = () => {
        const { currency, amount, destination, source, memo } = this.state;

        const txJson = {
            TransactionType: 'Payment',
            Account: source!.address,
            Destination: destination!.address,
            Sequence: 0,
        };

        if (destination?.tag) {
            Object.assign(txJson, {
                DestinationTag: Number(destination.tag),
            });
        }

        // set the amount
        if (typeof currency === 'string') {
            Object.assign(txJson, {
                Amount: new AmountParser(amount, false).nativeToDrops().toString(),
            });
        } else {
            Object.assign(txJson, {
                Amount: {
                    currency: currency.currency.currency,
                    issuer: currency.currency.issuer,
                    value: amount,
                },
            });
        }

        if (memo) {
            Object.assign(txJson, {
                Memos: [
                    {
                        Memo: Memo.Encode(memo),
                    },
                ],
            });
        }

        return txJson;
    };

    changeStep = (step: Steps) => {
        // @ts-ignore
        const { componentId } = this.props;

        // disable pop gesture in summary step for preventing closing the screen
        // while swiping the submit button
        if (step === Steps.Summary) {
            Navigator.mergeOptions(componentId, {
                popGesture: false,
            });
        }
        // change current step view
        this.setState({
            currentStep: step,
        });
    };

    submit = () => {
        const { payment, coreSettings } = this.state;

        this.changeStep(Steps.Submitting);

        // submit payment to the ledger
        payment.submit().then((submitResult) => {
            if (submitResult.success) {
                this.setState(
                    {
                        currentStep: Steps.Verifying,
                    },
                    () => {
                        payment.verify().then((result) => {
                            if (coreSettings.hapticFeedback) {
                                if (result.success) {
                                    VibrateHapticFeedback('notificationSuccess');
                                } else {
                                    VibrateHapticFeedback('notificationError');
                                }
                            }

                            this.changeStep(Steps.Result);
                        });
                    },
                );
            } else {
                if (coreSettings.hapticFeedback) {
                    VibrateHapticFeedback('notificationError');
                }
                this.changeStep(Steps.Result);
            }
        });
    };

    send = async () => {
        const { currency, amount, selectedFee, issuerFee, destination, source, payment, memo } = this.state;

        this.setState({
            isLoading: true,
        });

        try {
            // set values tho the payment transaction

            // set source account
            payment.Account = source!.address;

            // set the destination
            payment.Destination = destination!.address;

            if (typeof destination?.tag !== 'undefined') {
                payment.DestinationTag = destination.tag;
            }

            // set the amount
            if (typeof currency === 'string') {
                // native currency
                payment.Amount = {
                    currency: NetworkService.getNativeAsset(),
                    value: amount,
                };
            } else {
                // IOU
                // if issuer has transfer fee and sender/destination is not issuer, add partial payment flag
                if (
                    issuerFee &&
                    source!.address !== currency.currency.issuer &&
                    destination!.address !== currency.currency.issuer
                ) {
                    payment.Flags = {
                        PartialPayment: true,
                    };
                }

                // set the amount
                payment.Amount = {
                    currency: currency.currency.currency,
                    issuer: currency.currency.issuer,
                    value: amount,
                };
            }

            // set the calculated and selected fee
            payment.Fee = {
                currency: NetworkService.getNativeAsset(),
                value: new AmountParser(selectedFee!.value).dropsToNative().toFixed(),
            };

            // set memo if any
            if (memo) {
                payment.Memos = [Memo.Encode(memo)];
            } else if (payment.Memos) {
                payment.Memos = [];
            }

            // validate payment for all possible mistakes
            await PaymentValidation(payment);

            // sign the transaction and then submit
            await payment.sign(source!).then(this.submit);
        } catch (e: any) {
            if (e) {
                Navigator.showAlertModal({
                    type: 'error',
                    text: e.message,
                    buttons: [
                        {
                            text: Localize.t('global.ok'),
                            onPress: () => {},
                            light: false,
                        },
                    ],
                });
            }
            return;
        } finally {
            this.setState({
                isLoading: false,
            });
        }
    };

    goNext = () => {
        const { currentStep } = this.state;

        switch (currentStep) {
            case Steps.Result:
                Navigator.popToRoot();
                break;
            case Steps.Details:
                this.changeStep(Steps.Recipient);
                break;
            case Steps.Recipient:
                this.changeStep(Steps.Summary);
                break;
            case Steps.Summary:
                this.send();
                break;
            default:
                break;
        }
    };

    goBack = () => {
        const { currentStep } = this.state;

        switch (currentStep) {
            case Steps.Details:
                Navigator.pop();
                break;
            case Steps.Recipient:
                this.changeStep(Steps.Details);
                break;
            case Steps.Summary:
                this.changeStep(Steps.Recipient);
                break;
            default:
                break;
        }
    };

    renderStep = () => {
        const { currentStep } = this.state;

        let Step;

        switch (currentStep) {
            case Steps.Details:
                Step = DetailsStep;
                break;
            case Steps.Recipient:
                Step = RecipientStep;
                break;
            case Steps.Summary:
                Step = SummaryStep;
                break;
            case Steps.Submitting:
            case Steps.Verifying:
                Step = SubmittingStep;
                break;
            case Steps.Result:
                Step = ResultStep;
                break;
            default:
                return null;
        }

        return (
            <StepsContext.Provider
                value={{
                    ...this.state,
                    goNext: this.goNext,
                    goBack: this.goBack,
                    setAmount: this.setAmount,
                    setCurrency: this.setCurrency,
                    setFee: this.setFee,
                    setMemo: this.setMemo,
                    setIssuerFee: this.setIssuerFee,
                    setSource: this.setSource,
                    setDestination: this.setDestination,
                    setDestinationInfo: this.setDestinationInfo,
                    setScanResult: this.setScanResult,
                    getPaymentJsonForFee: this.getPaymentJsonForFee,
                }}
            >
                <Step />
            </StepsContext.Provider>
        );
    };

    onHeaderBackPress = () => {
        Keyboard.dismiss();
        setTimeout(Navigator.pop, 10);
    };

    renderHeader = () => {
        const { currentStep } = this.state;

        if ([Steps.Result, Steps.Submitting, Steps.Verifying].indexOf(currentStep) > -1) {
            return null;
        }

        const title =
            currentStep === Steps.Details
                ? Localize.t('global.send')
                : Localize.t(`global.${currentStep.toLowerCase()}`);

        return (
            <Header
                leftComponent={{
                    icon: 'IconChevronLeft',
                    onPress: this.onHeaderBackPress,
                }}
                centerComponent={{ text: title, extraComponent: <NetworkLabel type="both" /> }}
            />
        );
    };

    render() {
        return (
            <View onResponderRelease={() => Keyboard.dismiss()} testID="send-screen" style={styles.container}>
                {this.renderHeader()}
                {this.renderStep()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SendView;
