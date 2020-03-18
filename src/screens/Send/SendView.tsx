/**
 * Send Screen
 */

import { Results } from 'realm';
import { findIndex } from 'lodash';
import BigNumber from 'bignumber.js';

import React, { Component } from 'react';
import { View, Keyboard } from 'react-native';

import { Navigator } from '@common/helpers';

import { LedgerService } from '@services';
import { AppScreens } from '@common/constants';
import { AccountRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';
import { AccessLevels } from '@store/types';

import LedgerExchange from '@common/libs/ledger/exchange';
import { Payment } from '@common/libs/ledger/transactions';
import { Destination } from '@common/libs/ledger/parser/types';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

// components
import { Header } from '@components';

// local
import Localize from '@locale';

// style
import styles from './styles';

// steps
import { DetailsStep, RecipientStep, SummaryStep, SubmittingStep, ResultStep } from './Steps';

// context
import { StepsContext } from './Context';

/* types ==================================================================== */
export enum Steps {
    Details = 'Details',
    Recipient = 'Recipient',
    Summary = 'Summary',
    Submitting = 'Submitting',
    Verifying = 'Verifying',
    Result = 'Result',
}

export interface Props {
    currency: TrustLineSchema;
}

export interface State {
    currentStep: Steps;
    accounts: Results<AccountSchema>;
    source: AccountSchema;
    destination: Destination;
    destinationInfo: any;
    currency: TrustLineSchema | string;
    amount: string;
    payment: Payment;
}
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

        this.state = {
            currentStep: Steps.Details,
            accounts: AccountRepository.getAccounts({ accessLevel: AccessLevels.Full }),
            source: AccountRepository.getDefaultAccount(),
            destination: undefined,
            destinationInfo: undefined,
            currency: props.currency || 'XRP',
            amount: '',
            payment: new Payment(),
        };
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

    changeView = (step: Steps) => {
        // change current view
        this.setState({
            currentStep: step,
        });
    };

    commit = async () => {
        const { source } = this.state;

        // show vault overlay
        Navigator.showOverlay(
            AppScreens.Overlay.Vault,
            {
                overlay: {
                    handleKeyboardEvents: true,
                },
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            {
                account: source,
                onOpen: (privateKey: string) => {
                    this.submit(privateKey);
                },
            },
        );
    };

    submit = async (privateKey: string) => {
        const { currency, amount, destination, source, payment } = this.state;

        this.changeView(Steps.Submitting);

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

            // IF destination has same Trust Line
            if (haveSameTrustLine) {
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

                    payment.Amount = {
                        currency: currency.currency.currency,
                        issuer: currency.currency.issuer,
                        value: amount,
                    };

                    payment.Flags = [txFlags.Payment.PartialPayment];
                } else {
                    payment.Amount = {
                        currency: currency.currency.currency,
                        issuer: currency.currency.issuer,
                        value: amount,
                    };
                }
            } else {
                // *  Amount = XRP rounded up
                // *  SendMax = IOU
                const PAIR = { issuer: currency.currency.issuer, currency: currency.currency.currency };
                const ledgerExchange = new LedgerExchange(PAIR);
                // sync with latest order book
                await ledgerExchange.sync();

                // get liquidity grade
                const liquidityGrade = ledgerExchange.liquidityGrade('buy');

                // TODO: show error
                // not enough liquidity
                if (liquidityGrade === 0) {
                    return;
                }

                const exchangeRate = ledgerExchange.getExchangeRate('buy');
                const xrpRoundedUp = new BigNumber(amount).dividedBy(exchangeRate).decimalPlaces(6);

                // @ts-ignore
                payment.Amount = xrpRoundedUp.toString();
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

        // submit payment to the ledger
        payment.submit(privateKey).then(() => {
            this.setState(
                {
                    currentStep: Steps.Verifying,
                },
                () => {
                    payment.verify().then(() => {
                        this.changeView(Steps.Result);
                    });
                },
            );
        });
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
                this.commit();
                break;
            default:
                break;
        }
    };

    goBack = () => {
        const { currentStep } = this.state;

        switch (currentStep) {
            case Steps.Details:
                Navigator.popToRoot();
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
                }}
            >
                <Step />
            </StepsContext.Provider>
        );
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
                    onPress: () => {
                        Navigator.pop();
                    },
                }}
                centerComponent={{ text: title }}
            />
        );
    };

    render() {
        return (
            <View onResponderRelease={() => Keyboard.dismiss()} testID="send-view" style={[styles.container]}>
                {this.renderHeader()}
                {this.renderStep()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SendView;
