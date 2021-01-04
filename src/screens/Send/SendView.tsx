/**
 * Send Screen
 */

import { findIndex, find } from 'lodash';
import BigNumber from 'bignumber.js';

import React, { Component } from 'react';
import { View, Keyboard } from 'react-native';

import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { LedgerService } from '@services';
import { AppScreens } from '@common/constants';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import LedgerExchange from '@common/libs/ledger/exchange';
import { Payment } from '@common/libs/ledger/transactions';
import { Destination } from '@common/libs/ledger/parser/types';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

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
import { Steps, Props, State } from './types';

/* Component ==================================================================== */
class SendView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Payment;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const accounts = AccountRepository.getSpendableAccounts();

        this.state = {
            currentStep: Steps.Details,
            accounts,
            source: find(accounts, { default: true }) || accounts[0],
            destination: undefined,
            destinationInfo: undefined,
            currency: props.currency || 'XRP',
            amount: props.amount || '',
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
            setTimeout(() => {
                Navigator.pop();
                Toast(Localize.t('global.noSpendableAccountIsAvailableForSendingPayment'));
            }, 1000);
        }
    }

    setSource = (source: AccountSchema) => {
        this.setState({ source });
    };

    setCurrency = (currency: TrustLineSchema | string) => {
        this.setState({ currency });
    };

    setAmount = (amount: string) => {
        this.setState({ amount });
    };

    setDestination = (destination: Destination) => {
        this.setState({ destination });
    };

    setDestinationInfo = (info: any) => {
        this.setState({ destinationInfo: info });
    };

    setScanResult = (result: any) => {
        this.setState({ scanResult: result });
    };

    changeView = (step: Steps) => {
        // change current view
        this.setState({
            currentStep: step,
        });
    };

    submit = () => {
        const { payment, coreSettings } = this.state;

        this.changeView(Steps.Submitting);

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

                            this.changeView(Steps.Result);
                        });
                    },
                );
            } else {
                if (coreSettings.hapticFeedback) {
                    VibrateHapticFeedback('notificationError');
                }
                this.changeView(Steps.Result);
            }
        });
    };

    send = async () => {
        const { currency, amount, destination, source, payment } = this.state;

        this.setState({
            isLoading: true,
        });

        // XRP
        if (typeof currency === 'string') {
            // @ts-ignore
            payment.Amount = amount;
        } else {
            // IOU

            // get destination trust lines
            const destinationLines = await LedgerService.getAccountLines(destination.address);
            const { lines } = destinationLines;

            const haveSameTrustLine =
                findIndex(lines, (l: any) => {
                    return l.currency === currency.currency.currency && l.account === currency.currency.issuer;
                }) !== -1;

            // IF destination has same Trust Line or it's the issuer
            if (haveSameTrustLine || currency.currency.issuer === destination.address) {
                // IF issuer has transfer rate:
                if (currency.transfer_rate) {
                    // FIXME
                    /**
                     *      NOTIFICATION (question) to user: who pays fee of 0.X % (transfer rate?)
                     *          Me (1.002 » 1):
                     *              DeliverMin + Transfer Rate
                     *          Recipient (1 » deliver 0.998):
                     *              DeliverMin
                     */

                    payment.TransferRate = currency.transfer_rate;
                }

                payment.Amount = {
                    currency: currency.currency.currency,
                    issuer: currency.currency.issuer,
                    value: amount,
                };

                if (currency.transfer_rate || currency.currency.issuer === source.address) {
                    payment.Flags = [txFlags.Payment.PartialPayment];
                }
            } else {
                // *  Amount = XRP rounded up
                // *  SendMax = IOU
                const PAIR = { issuer: currency.currency.issuer, currency: currency.currency.currency };
                const ledgerExchange = new LedgerExchange(PAIR);
                // sync with latest order book
                await ledgerExchange.initialize();

                // get liquidity
                const liquidity = await ledgerExchange.getLiquidity('buy', Number(amount));

                // TODO: show error
                // not enough liquidity
                if (!liquidity.safe || liquidity.errors?.length > 0) {
                    // TODO: handle better
                    Navigator.showAlertModal({
                        type: 'error',
                        text: Localize.t('send.unableToSendPaymentNotEnoughLiquidity'),
                        buttons: [
                            {
                                text: Localize.t('global.ok'),
                                onPress: () => {},
                                light: false,
                            },
                        ],
                    });
                    return;
                }

                const xrpRoundedUp = new BigNumber(amount).multipliedBy(liquidity.rate).decimalPlaces(6).toString(10);

                // @ts-ignore
                payment.Amount = xrpRoundedUp;
                payment.SendMax = {
                    currency: currency.currency.currency,
                    issuer: currency.currency.issuer,
                    value: amount,
                };

                payment.Flags = [txFlags.Payment.PartialPayment];
            }
        }

        // set the destination
        payment.Destination = {
            address: destination.address,
            tag: destination.tag,
        };

        // set source account
        payment.Account = {
            address: source.address,
        };

        try {
            // validate payment for all possible mistakes
            await payment.validate(source);

            // sign the transaction
            await payment.sign(source).then(this.submit);
        } catch (e) {
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
                this.changeView(Steps.Recipient);
                break;
            case Steps.Recipient:
                this.changeView(Steps.Summary);
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
                this.changeView(Steps.Details);
                break;
            case Steps.Summary:
                this.changeView(Steps.Recipient);
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
