/**
 * Review Transaction Screen
 */

import React, { Component } from 'react';
import { View, Text, Alert, Linking, BackHandler, Keyboard, NativeEventSubscription } from 'react-native';

import { AppScreens } from '@common/constants';

import { VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

// services
import { PushNotificationsService, AccountService, LedgerService, StyleService } from '@services';

import { CoreRepository, CurrencyRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// transaction parser
import transactionFactory from '@common/libs/ledger/parser/transaction';

// components
import { Button, Icon, Spacer } from '@components/General';

import { PayloadOrigin } from '@common/libs/payload';

// localize
import Localize from '@locale';

// style
import { AppStyles } from '@theme';

import { ReviewStep, SubmittingStep, ResultStep } from './Steps';
// context
import { StepsContext } from './Context';

import { Steps, Props, State } from './types';
/* Component ==================================================================== */
class ReviewTransactionModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.ReviewTransaction;

    private backHandler: NativeEventSubscription;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            payload: props.payload,
            transaction: transactionFactory(props.payload.TxJson),
            source: undefined,
            currentStep: Steps.Review,
            submitResult: undefined,
            isPreparing: false,
            isValidating: false,
            isValidPayload: true,
            hasError: false,
            errorMessage: '',
            coreSettings: CoreRepository.getSettings(),
        };
    }

    componentDidMount() {
        // back handler listener on android
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onHardwareBackPress);

        // update the accounts details before process the review
        AccountService.updateAccountsDetails();
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidCatch() {
        this.setState({ hasError: true });
    }

    onHardwareBackPress = () => {
        const { currentStep } = this.state;

        if (currentStep === Steps.Review) {
            this.onClose();
        }

        return true;
    };

    getTransactionLabel = () => {
        const { payload, transaction } = this.state;

        let type = '';

        switch (payload.payload.tx_type) {
            case 'AccountSet':
                type = Localize.t('events.updateAccountSettings');
                break;
            case 'AccountDelete':
                type = Localize.t('events.deleteAccount');
                break;
            case 'EscrowFinish':
                type = Localize.t('events.finishEscrow');
                break;
            case 'EscrowCancel':
                type = Localize.t('events.cancelEscrow');
                break;
            case 'EscrowCreate':
                type = Localize.t('events.createEscrow');
                break;
            case 'SetRegularKey':
                type = Localize.t('events.setARegularKey');
                break;
            case 'SignerListSet':
                type = Localize.t('events.setSignerList');
                break;
            case 'TrustSet':
                type = Localize.t('events.updateAccountAssets');
                break;
            case 'OfferCreate':
                type = Localize.t('events.createOffer');
                break;
            case 'OfferCancel':
                type = Localize.t('events.cancelOffer');
                break;
            case 'DepositPreauth':
                if (transaction.Authorize) {
                    type = Localize.t('events.authorizeDeposit');
                } else {
                    type = Localize.t('events.unauthorizeDeposit');
                }
                break;
            case 'CheckCreate':
                type = Localize.t('events.createCheck');
                break;
            case 'CheckCash':
                type = Localize.t('events.cashCheck');
                break;
            case 'CheckCancel':
                type = Localize.t('events.cancelCheck');
                break;
            case 'TicketCreate':
                type = Localize.t('events.createTicket');
                break;
            case 'PaymentChannelCreate':
                type = Localize.t('events.createPaymentChannel');
                break;
            case 'PaymentChannelFund':
                type = Localize.t('events.fundPaymentChannel');
                break;
            case 'PaymentChannelClaim':
                type = Localize.t('events.claimPaymentChannel');
                break;
            case 'SignIn':
                type = Localize.t('global.signIn');
                break;
            default:
                type = payload.payload.tx_type;
                break;
        }

        return type;
    };

    prepareAndSignTransaction = async () => {
        const { source, transaction } = this.state;
        const { payload } = this.props;

        this.setState({
            isPreparing: true,
        });

        await transaction
            .sign(source, payload.isMultiSign())
            .then(this.submit)
            .catch((e) => {
                if (e) {
                    if (typeof e.toString === 'function') {
                        Alert.alert(Localize.t('global.error'), e.toString());
                    } else {
                        Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
                    }
                }

                this.setState({
                    currentStep: Steps.Review,
                    isPreparing: false,
                });
            });
    };

    onDecline = () => {
        const { onDecline, payload } = this.props;

        // reject the payload
        payload.reject();

        // emit sign requests update
        setTimeout(() => {
            PushNotificationsService.emit('signRequestUpdate');
        }, 1000);

        // close modal
        Navigator.dismissModal().then(() => {
            if (typeof onDecline === 'function') {
                onDecline();
            }
        });
    };

    closeReviewModal = () => {
        // emit sign requests update
        setTimeout(() => {
            PushNotificationsService.emit('signRequestUpdate');
        }, 1000);

        Navigator.dismissModal();
    };

    onClose = () => {
        const { payload } = this.props;
        const { isValidPayload } = this.state;

        // dismiss keyboard if it's present
        Keyboard.dismiss();

        // if payload generated by xumm close it immediately
        if (payload.isGenerated() || !isValidPayload) {
            Navigator.dismissModal();
            // if the payload origin is xApp the decline the request
        } else if (payload.getOrigin() === PayloadOrigin.XAPP) {
            this.onDecline();
        } else {
            // otherwise show dialog for reject
            Navigator.showOverlay(AppScreens.Overlay.RequestDecline, {
                onDecline: this.onDecline,
                onClose: this.closeReviewModal,
            });
        }
    };

    onAccept = async () => {
        const { payload } = this.props;
        const { source, transaction } = this.state;

        try {
            // set loading
            this.setState({ isValidating: true });

            // validate payload by fetching it again
            try {
                if (!payload.isGenerated()) {
                    await payload.validate();
                }
            } catch (e: any) {
                Navigator.showAlertModal({
                    type: 'error',
                    text: e.message,
                    buttons: [
                        {
                            text: Localize.t('global.ok'),
                            type: 'dismiss',
                        },
                    ],
                });

                this.setState({
                    isValidPayload: false,
                });

                return;
            }

            try {
                // if any validation set to the transaction run and check
                if (typeof transaction.validate === 'function') {
                    await transaction.validate(source, payload.isMultiSign());
                }
            } catch (e: any) {
                Navigator.showAlertModal({
                    type: 'error',
                    text: e.message,
                    buttons: [
                        {
                            text: Localize.t('global.ok'),
                            type: 'dismiss',
                        },
                    ],
                });
                return;
            }

            // account is not activated and want to sign a tx
            if (payload.payload.tx_type !== 'SignIn' && !payload.isMultiSign() && source.balance === 0) {
                Navigator.showAlertModal({
                    type: 'error',
                    text: Localize.t('account.selectedAccountIsNotActivatedPleaseChooseAnotherOne'),
                    buttons: [
                        {
                            text: Localize.t('global.ok'),
                            light: false,
                        },
                    ],
                });
                return;
            }

            // check for account delete and alert user
            if (transaction.Type === 'AccountDelete') {
                Navigator.showAlertModal({
                    type: 'error',
                    title: Localize.t('global.danger'),
                    text: Localize.t('account.deleteAccountWarning', {
                        ownerReserve: LedgerService.getNetworkReserve().OwnerReserve,
                    }),
                    buttons: [
                        {
                            text: Localize.t('global.back'),
                            light: false,
                        },
                        {
                            text: Localize.t('global.continue'),
                            onPress: this.prepareAndSignTransaction,
                            type: 'dismiss',
                            light: true,
                        },
                    ],
                });
                return;
            }

            // show alert if user adding a new trustline
            if (transaction.Type === 'TrustSet') {
                // check if user is adding the trustline
                if (
                    !source.hasCurrency({
                        issuer: transaction.Issuer,
                        currency: transaction.Currency,
                    })
                ) {
                    Navigator.showAlertModal({
                        testID: 'new-trust-line-alert-overlay',
                        type: 'warning',
                        title: Localize.t('global.warning'),
                        text: Localize.t('asset.addingTrustLineWarning'),
                        buttons: [
                            {
                                testID: 'back-button',
                                text: Localize.t('global.back'),
                                light: false,
                            },
                            {
                                testID: 'continue-button',
                                text: Localize.t('global.continue'),
                                onPress: this.prepareAndSignTransaction,
                                type: 'dismiss',
                                light: true,
                            },
                        ],
                    });
                    return;
                }
            }

            // show alert if user trading not vetted tokens
            if (transaction.Type === 'OfferCreate') {
                let shouldShowAlert = false;

                const takerPays = transaction.TakerPays;

                if (takerPays.currency !== 'XRP') {
                    if (
                        !CurrencyRepository.isVettedCurrency({
                            issuer: takerPays.issuer,
                            currency: takerPays.currency,
                        })
                    ) {
                        shouldShowAlert = true;
                    }
                }

                if (shouldShowAlert) {
                    Navigator.showAlertModal({
                        type: 'warning',
                        title: Localize.t('global.warning'),
                        text: Localize.t('payload.notVettedTokenTradeWarning'),
                        buttons: [
                            {
                                text: Localize.t('global.back'),
                                light: false,
                            },
                            {
                                text: Localize.t('global.continue'),
                                onPress: this.prepareAndSignTransaction,
                                type: 'dismiss',
                                light: true,
                            },
                        ],
                    });
                    return;
                }
            }

            // check for asfDisableMaster
            if (transaction.Type === 'AccountSet' && transaction.SetFlag === 'asfDisableMaster') {
                Navigator.showAlertModal({
                    type: 'warning',
                    text: Localize.t('account.disableMasterKeyWarning'),
                    buttons: [
                        {
                            text: Localize.t('global.cancel'),
                            light: false,
                        },
                        {
                            text: Localize.t('global.continue'),
                            onPress: this.prepareAndSignTransaction,
                            type: 'dismiss',
                            light: true,
                        },
                    ],
                });
                return;
            }

            // if everything is fine prepare the transacgtion for signing
            this.prepareAndSignTransaction();
        } finally {
            this.setState({
                isValidating: false,
            });
        }
    };

    setError = (message: string) => {
        this.setState({
            hasError: true,
            errorMessage: message,
        });
    };

    setSource = (item: AccountSchema) => {
        const { payload } = this.props;
        const { transaction } = this.state;

        // set the source account to payload
        // ignore if it's multisign
        if (!payload.isMultiSign()) {
            transaction.Account = { address: item.address };
        }

        // change state
        this.setState({
            source: item,
        });
    };

    submit = async () => {
        const { payload } = this.props;
        const { transaction, coreSettings } = this.state;

        try {
            // create patch object
            const payloadPatch = {
                signed_blob: transaction.TxnSignature,
                tx_id: transaction.Hash,
                signmethod: transaction.SignMethod,
                multisigned: payload.isMultiSign() ? transaction.Account.address : '',
            };

            // check if we need to submit the payload to the XRP Ledger
            if (payload.shouldSubmit()) {
                this.setState({
                    currentStep: Steps.Submitting,
                });

                // submit the transaction to the xrp ledger
                const submitResult = await transaction.submit();

                // if submitted then verify
                if (submitResult.success) {
                    this.setState({ currentStep: Steps.Verifying });

                    // verify transaction
                    const verifyResult = await transaction.verify();

                    // update submit result base on verify result
                    if (verifyResult.success) {
                        if (submitResult.engineResult !== 'tesSUCCESS') {
                            submitResult.engineResult = 'tesSUCCESS';
                        }
                    } else {
                        submitResult.success = false;
                    }

                    if (coreSettings.hapticFeedback) {
                        if (verifyResult.success) {
                            VibrateHapticFeedback('notificationSuccess');
                        } else {
                            VibrateHapticFeedback('notificationError');
                        }
                    }
                } else if (coreSettings.hapticFeedback) {
                    VibrateHapticFeedback('notificationError');
                }

                // include submit result in the payload patch
                Object.assign(payloadPatch, {
                    dispatched: {
                        to: submitResult.node,
                        nodetype: submitResult.nodeType,
                        result: submitResult.engineResult,
                    },
                });

                this.setState({
                    submitResult,
                });
            }

            // patch the payload
            payload.patch(payloadPatch);

            // emit sign requests update
            setTimeout(() => {
                PushNotificationsService.emit('signRequestUpdate');
            }, 1000);

            this.setState({
                currentStep: Steps.Result,
            });
        } catch (e) {
            this.setState({
                currentStep: Steps.Review,
            });
            if (typeof e.toString === 'function') {
                Alert.alert(Localize.t('global.error'), e.toString());
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
            }
        }
    };

    onFinish = () => {
        const { onResolve, payload } = this.props;

        const { return_url_app } = payload.meta;

        if (return_url_app) {
            Linking.openURL(return_url_app).catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('global.unableOpenReturnURL'));
            });
        }
        Navigator.dismissModal().then(() => {
            if (typeof onResolve === 'function') {
                onResolve();
            }
        });
    };

    renderError = () => {
        const { errorMessage } = this.state;
        return (
            <View
                testID="review-error-view"
                style={[
                    AppStyles.container,
                    AppStyles.paddingSml,
                    { backgroundColor: StyleService.value('$lightBlue') },
                ]}
            >
                <Icon name="IconInfo" style={{ tintColor: StyleService.value('$contrast') }} size={70} />
                <Spacer size={20} />
                <Text style={AppStyles.h5}>{Localize.t('global.error')}</Text>
                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                    {errorMessage || Localize.t('payload.unexpectedPayloadErrorOccurred')}
                </Text>
                <Spacer size={40} />
                <Button
                    testID="back-button"
                    label={Localize.t('global.back')}
                    onPress={() => {
                        this.onDecline();
                    }}
                />
            </View>
        );
    };

    render() {
        const { currentStep, hasError } = this.state;

        // don't render if any error happened
        // this can happen if there is a missing field in the payload
        if (hasError) return this.renderError();

        let Step = null;

        switch (currentStep) {
            case Steps.Review:
                Step = ReviewStep;
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
                    setSource: this.setSource,
                    onClose: this.onClose,
                    onAccept: this.onAccept,
                    onFinish: this.onFinish,
                    getTransactionLabel: this.getTransactionLabel,
                }}
            >
                <Step />
            </StepsContext.Provider>
        );
    }
}

/* Export Component ==================================================================== */
export default ReviewTransactionModal;
