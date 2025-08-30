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
import {
    CheckCreate,
    CheckCreateValidation,
    Payment,
    PaymentValidation,
    Remit,
    RemitValidation,
} from '@common/libs/ledger/transactions';
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

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        // default values
        const coreSettings = CoreRepository.getSettings();
        const spendableAccounts = AccountRepository.getSpendableAccounts();
        const PaymentWithSigMixin = SignMixin(Payment);
        const CheckWithSigMixin = SignMixin(CheckCreate);
        const RemitWithSigMixin = SignMixin(Remit);

        // console.log('SendView constructor')

        this.state = {
            currentStep: Steps.Details,
            accounts: spendableAccounts,
            payment: new PaymentWithSigMixin(),
            check: new CheckWithSigMixin(),
            remit: new RemitWithSigMixin(),
            source: find(spendableAccounts, { address: coreSettings.account.address }) ?? first(spendableAccounts),
            token: props.token ?? NetworkService.getNativeAsset(),
            amount: props.amount ?? '',
            memo: undefined,
            selectedFee: undefined,
            issuerFee: undefined,
            credentials: [],
            altTxTypeTo: '',
            serviceFeeAmount: undefined,
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
        const { isLoading, payment, check, remit } = this.state;

        if (this.closeTimeout) clearTimeout(this.closeTimeout);

        // abort the transaction if already running
        if (isLoading && payment) {
            payment.abort();
            check.abort();
            remit.abort();
        }
    }

    setSource = (source: AccountModel) => {
        this.setState({ source });
    };

    setToken = (token: TrustLineModel | string) => {
        this.setState({
            token,
        });
    };

    setAmount = (amount: string) => {
        this.setState({ amount });
    };

    setFee = (selectedFee: FeeItem, serviceFee: FeeItem) => {
        const { payment } = this.state;
        this.setState({ selectedFee });

        // console.log('SendView Service Fee Amount Set', serviceFeeAmount.value);
        if (serviceFee) {
            payment.setServiceFee(Number(serviceFee.value));
            this.setState({ serviceFeeAmount: serviceFee });
        };
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

    setCredentials = (credentials: string[]) => {
        this.setState({ credentials });
    };

    submitAsAltTxTypeTo = (destination: string) => {
        this.setState({ altTxTypeTo: destination });
    };

    setScanResult = (result: any) => {
        this.setState({ scanResult: result });
    };

    getPaymentJsonForFee = () => {
        const { token, amount, destination, source, memo, credentials, altTxTypeTo } = this.state;

        const txJson: {
            TransactionType: string;
            Account: string;
            Destination: string;
            Sequence: number;
            Amount?: string | { currency: string; issuer: string; value: string };
            Amounts?: { AmountEntry: { Amount: string | { currency: string; issuer: string; value: string } } }[];
        } = {
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
        if (typeof token === 'string') {
            Object.assign(txJson, {
                Amount: new AmountParser(amount, false).nativeToDrops().toString(),
            });
        } else {
            Object.assign(txJson, {
                Amount: {
                    currency: token.currency.currencyCode,
                    issuer: token.currency.issuer,
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

        if (credentials && credentials.length > 0) {
            Object.assign(txJson, {
                CredentialIDs: credentials,
            });
        }

        if (altTxTypeTo && altTxTypeTo !== '') {
            const [type, address] = altTxTypeTo.split(':');
            if (address === txJson.Destination) {
                if (type === 'Check') {
                    txJson.TransactionType = 'CheckCreate';
                } else if (type === 'Remit' && (txJson as any)?.Amount) {
                    txJson.TransactionType = 'Remit';
                    Object.assign(txJson, {
                        Amounts: [
                            {
                                AmountEntry: {
                                    Amount: txJson.Amount,
                                },
                            },
                        ],
                    });
                    delete txJson.Amount;
                }
            }
        }

        return txJson;
    };

    changeStep = (step: Steps) => {
        const { componentId } = this.props as { componentId: any };

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
        const { payment, check, remit, coreSettings, altTxTypeTo } = this.state;

        this.changeStep(Steps.Submitting);

        const txType = (altTxTypeTo && altTxTypeTo !== '' ? altTxTypeTo.split(':')[0] : 'payment')
            .toLocaleLowerCase();

        const _tx = txType === 'remit' ? remit : txType === 'check' ? check : payment;

        // submit payment to the ledger
        _tx.submit().then((submitResult) => {
            if (submitResult.success) {
                this.setState(
                    {
                        currentStep: Steps.Verifying,
                    },
                    () => {
                        _tx.verify().then((result) => {
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
        const {
            token,
            amount,
            selectedFee,
            issuerFee,
            destination,
            source,
            altTxTypeTo,
            payment,
            check,
            remit,
            memo,
            credentials,
        } = this.state;

        this.setState({
            isLoading: true,
        });

        try {
            const txType = (altTxTypeTo && altTxTypeTo !== '' ? altTxTypeTo.split(':')[0] : 'payment')
                .toLocaleLowerCase();
            const _tx = txType === 'remit' ? remit : txType === 'check' ? check : payment;

            // set values to the payment transaction

            // set source account
            _tx.Account = source!.address;

            // set the destination
            _tx.Destination = destination!.address;

            if (typeof destination?.tag !== 'undefined') {
                _tx.DestinationTag = Number(destination.tag);
            }

            // set the amount
            if (typeof token === 'string') {
                // native token
                const am = {
                    currency: NetworkService.getNativeAsset(),
                    value: amount,
                };
                if (_tx instanceof Payment) {
                    _tx.Amount = am;
                }
                if (_tx instanceof CheckCreate) {
                    _tx.SendMax = am;
                }
                if (_tx instanceof Remit) {
                    _tx.Amounts = [ am ];
                }
            } else {
                // IOU
                // if issuer has transfer fee and sender/destination is not issuer, add partial payment flag
                if (
                    issuerFee &&
                    source!.address !== token.currency.issuer &&
                    destination!.address !== token.currency.issuer
                ) {
                    _tx.Flags = {
                        tfPartialPayment: true,
                    };
                }

                // set the amount
                const am = {
                    currency: token.currency.currencyCode,
                    issuer: token.currency.issuer,
                    value: amount,
                };

                if (_tx instanceof Payment) {
                    _tx.Amount = am;
                }
                if (_tx instanceof CheckCreate) {
                    _tx.SendMax = am;
                }
                if (_tx instanceof Remit) {
                    _tx.Amounts = [ am ];
                }
            }

            // set the calculated and selected fee
            _tx.Fee = {
                currency: NetworkService.getNativeAsset(),
                value: new AmountParser(selectedFee!.value).dropsToNative().toFixed(),
            };

            // set memo if any
            if (memo) {
                _tx.Memos = [Memo.Encode(memo)];
            } else if (_tx.Memos) {
                _tx.Memos = [];
            }

            if (credentials && credentials.length > 0) {
                if (_tx instanceof Payment) {
                    _tx.CredentialIDs = credentials;
                }
            }

            // validate payment for all possible mistakes
            // console.log(txType, payment, check, remit)

            if (txType === 'payment') {
                await PaymentValidation(payment);
            }
            if (txType === 'check') {
                await CheckCreateValidation(check);
            }
            if (txType === 'remit') {
                await RemitValidation(remit);
            }

            // sign the transaction and then submit
            await _tx.sign(source!).then(this.submit);
        } catch (error: any) {
            if (error) {
                Navigator.showAlertModal({
                    type: 'error',
                    text: error.message,
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
        const { timestamp } = this.props;

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
                    timestamp,
                    goNext: this.goNext,
                    goBack: this.goBack,
                    setAmount: this.setAmount,
                    setToken: this.setToken,
                    setFee: this.setFee,
                    setMemo: this.setMemo,
                    setCredentials: this.setCredentials,
                    submitAsAltTxTypeTo: this.submitAsAltTxTypeTo,
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
        const {timestamp} = this.props;

        return (
            <View
                key={`sendview-${timestamp}`}
                onResponderRelease={() => Keyboard.dismiss()}
                testID="send-screen"
                style={styles.container}
            >
                {this.renderHeader()}
                {this.renderStep()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SendView;
