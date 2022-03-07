/**
 * Send Screen
 */

import { find } from 'lodash';

import React, { Component } from 'react';
import { View, Keyboard } from 'react-native';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { AppScreens } from '@common/constants';

import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { Amount } from '@common/libs/ledger/parser/common';
import { Payment } from '@common/libs/ledger/transactions';
import { Destination } from '@common/libs/ledger/parser/types';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { NFTValueToXRPL, XRPLValueToNFT } from '@common/utils/amount';
// components
import { Header } from '@components/General';

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

    private closeTimeout: any;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        // default values
        const accounts = AccountRepository.getSpendableAccounts();
        const source = find(accounts, { default: true }) || accounts[0];
        const currency = props.currency || 'XRP';
        const sendingNFT = typeof currency !== 'string' && currency.isNFT;
        const amount = props.amount ? (sendingNFT ? String(XRPLValueToNFT(Number(props.amount))) : props.amount) : '';

        this.state = {
            currentStep: Steps.Details,
            accounts,
            source,
            currency,
            sendingNFT,
            amount,
            availableFees: undefined,
            selectedFee: undefined,
            issuerFee: undefined,
            destination: undefined,
            destinationInfo: undefined,
            payment: new Payment(),
            scanResult: props.scanResult || undefined,
            coreSettings: CoreRepository.getSettings(),
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

    setSource = (source: AccountSchema) => {
        this.setState({ source });
    };

    setCurrency = (currency: TrustLineSchema | string) => {
        this.setState({
            currency,
            sendingNFT: typeof currency !== 'string' && currency.isNFT,
        });
    };

    setAmount = (amount: string) => {
        this.setState({ amount });
    };

    setAvailableFees = (availableFees: FeeItem[]) => {
        this.setState({ availableFees });
    };

    setFee = (selectedFee: FeeItem) => {
        this.setState({ selectedFee });
    };

    setIssuerFee = (issuerFee: number) => {
        this.setState({ issuerFee });
    };

    setDestination = (_destination: Destination) => {
        const { destination, destinationInfo } = this.state;
        this.setState({
            destination: _destination,
            destinationInfo: _destination?.address !== destination?.address ? undefined : destinationInfo,
        });
    };

    setDestinationInfo = (info: any) => {
        this.setState({ destinationInfo: info });
    };

    setScanResult = (result: any) => {
        this.setState({ scanResult: result });
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
        const { currency, amount, selectedFee, issuerFee, destination, source, payment, sendingNFT } = this.state;

        this.setState({
            isLoading: true,
        });

        try {
            // XRP
            if (typeof currency === 'string') {
                payment.Amount = amount;
            } else {
                // if issuer has transfer fee and sender is not issuer add partial payment flag
                if (issuerFee || currency.currency.issuer === source.address) {
                    payment.Flags = [txFlags.Payment.PartialPayment];
                }

                // set the amount
                payment.Amount = {
                    currency: currency.currency.currency,
                    issuer: currency.currency.issuer,
                    value: sendingNFT ? NFTValueToXRPL(amount) : amount,
                };
            }

            // set the calculated fee
            payment.Fee = new Amount(selectedFee.value).dropsToXrp();

            // set the destination
            payment.Destination = {
                address: destination.address,
                tag: destination.tag,
            };

            // set source account
            payment.Account = {
                address: source.address,
            };

            // validate payment for all possible mistakes
            await payment.validate(source);

            // sign the transaction
            await payment.sign(source).then(this.submit);
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

        let Step = null;

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
                break;
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
                    setAvailableFees: this.setAvailableFees,
                    setIssuerFee: this.setIssuerFee,
                    setSource: this.setSource,
                    setDestination: this.setDestination,
                    setDestinationInfo: this.setDestinationInfo,
                    setScanResult: this.setScanResult,
                }}
            >
                <Step />
            </StepsContext.Provider>
        );
    };

    onHeaderBackPress = () => {
        Keyboard.dismiss();
        setTimeout(() => {
            Navigator.pop();
        }, 10);
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
                centerComponent={{ text: title }}
            />
        );
    };

    render() {
        return (
            <View onResponderRelease={() => Keyboard.dismiss()} testID="send-screen" style={[styles.container]}>
                {this.renderHeader()}
                {this.renderStep()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SendView;
