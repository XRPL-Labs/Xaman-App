/**
 * Review Transaction Screen
 */

import React, { Component } from 'react';
import { Alert, BackHandler, Keyboard, Linking, NativeEventSubscription, Text, View } from 'react-native';

import { AppScreens } from '@common/constants';

import { PushNotificationsService, NetworkService, StyleService } from '@services';

import { AccountRepository, CoreRepository, CurrencyRepository } from '@store/repositories';
import { AccountModel } from '@store/models';

import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types';
import { BaseTransaction } from '@common/libs/ledger/transactions';

import { PatchSuccessType, PayloadOrigin } from '@common/libs/payload';

import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { getAccountInfo } from '@common/helpers/resolver';

import { Button, Icon, InfoMessage, Spacer } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';

import { PreflightStep, ReviewStep, SubmittingStep, ResultStep } from './Steps';
import { StepsContext } from './Context';
import { Props, State, Steps } from './types';
import { PseudoTransactions, Transactions } from '@common/libs/ledger/transactions/types';
import ValidationFactory from '@common/libs/ledger/factory/validation';

/* Component ==================================================================== */
class ReviewTransactionModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.ReviewTransaction;

    private backHandler: NativeEventSubscription;
    private mounted = false;

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
            transaction: undefined,
            accounts: undefined,
            source: undefined,
            currentStep: Steps.Preflight,
            submitResult: undefined,
            isLoading: false,
            isReady: true,
            isValidPayload: true,
            hasError: false,
            errorMessage: undefined,
            coreSettings: CoreRepository.getSettings(),
        };
    }

    static getDerivedStateFromError(error: any): Partial<State> {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, errorMessage: error?.message };
    }

    componentDidMount() {
        // track if component is mounted
        this.mounted = true;

        // back handler listener on android
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onHardwareBackPress);
    }

    componentWillUnmount() {
        const { transaction } = this.state;

        // track if component is mounted
        this.mounted = false;

        // unsubscribe from back handler
        if (this.backHandler) {
            this.backHandler.remove();
        }

        // abort the transaction if we are leaving the review screen
        if (transaction) {
            transaction.abort();
        }
    }

    onHardwareBackPress = () => {
        const { currentStep, hasError } = this.state;

        if (currentStep === Steps.Review) {
            if (hasError) {
                this.onDecline();
            } else {
                this.onClose();
            }
        }

        return true;
    };

    getTransactionLabel = () => {
        const { transaction } = this.state;

        switch (transaction.Type) {
            case TransactionTypes.AccountSet:
                if (transaction.isNoOperation() && transaction.isCancelTicket()) {
                    return Localize.t('events.cancelTicket');
                }
                return Localize.t('events.updateAccountSettings');
            case TransactionTypes.AccountDelete:
                return Localize.t('events.deleteAccount');
            case TransactionTypes.EscrowFinish:
                return Localize.t('events.finishEscrow');
            case TransactionTypes.EscrowCancel:
                return Localize.t('events.cancelEscrow');
            case TransactionTypes.EscrowCreate:
                return Localize.t('events.createEscrow');
            case TransactionTypes.SetRegularKey:
                return Localize.t('events.setARegularKey');
            case TransactionTypes.SignerListSet:
                return Localize.t('events.setSignerList');
            case TransactionTypes.TrustSet:
                return Localize.t('events.updateAccountAssets');
            case TransactionTypes.OfferCreate:
                return Localize.t('events.createOffer');
            case TransactionTypes.OfferCancel:
                return Localize.t('events.cancelOffer');
            case TransactionTypes.DepositPreauth:
                if (transaction.Authorize) {
                    return Localize.t('events.authorizeDeposit');
                }
                return Localize.t('events.unauthorizeDeposit');
            case TransactionTypes.CheckCreate:
                return Localize.t('events.createCheck');
            case TransactionTypes.CheckCash:
                return Localize.t('events.cashCheck');
            case TransactionTypes.CheckCancel:
                return Localize.t('events.cancelCheck');
            case TransactionTypes.TicketCreate:
                return Localize.t('events.createTicket');
            case TransactionTypes.PaymentChannelCreate:
                return Localize.t('events.createPaymentChannel');
            case TransactionTypes.PaymentChannelFund:
                return Localize.t('events.fundPaymentChannel');
            case TransactionTypes.PaymentChannelClaim:
                return Localize.t('events.claimPaymentChannel');
            case TransactionTypes.NFTokenMint:
                return Localize.t('events.mintNFT');
            case TransactionTypes.NFTokenBurn:
                return Localize.t('events.burnNFT');
            case TransactionTypes.NFTokenCreateOffer:
                return Localize.t('events.createNFTOffer');
            case TransactionTypes.NFTokenCancelOffer:
                return Localize.t('events.cancelNFTOffer');
            case TransactionTypes.NFTokenAcceptOffer:
                return Localize.t('events.acceptNFTOffer');
            case PseudoTransactionTypes.SignIn:
                return Localize.t('global.signIn');
            case PseudoTransactionTypes.PaymentChannelAuthorize:
                return Localize.t('global.paymentChannelAuthorize');
            default:
                return transaction.Type;
        }
    };

    prepareAndSignTransaction = async () => {
        const { source, transaction } = this.state;
        const { payload } = this.props;

        // if not mounted return
        if (!this.mounted) {
            return;
        }

        this.setState({
            isLoading: true,
        });

        await transaction
            .sign(source, payload.isMultiSign())
            .then(this.submit)
            .catch((error: Error) => {
                if (this.mounted) {
                    if (error) {
                        if (typeof error.message === 'string') {
                            Alert.alert(Localize.t('global.error'), error.message);
                        } else {
                            Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
                        }
                    }

                    this.setState({
                        currentStep: Steps.Review,
                        isLoading: false,
                    });
                }
            });
    };

    onDecline = () => {
        const { onDecline, payload } = this.props;
        const { hasError, errorMessage } = this.state;

        // reject the payload
        payload.reject(hasError ? 'APP' : 'USER', errorMessage);

        // emit sign requests update
        setTimeout(() => {
            PushNotificationsService.emit('signRequestUpdate');
        }, 1000);

        // close modal
        Navigator.dismissModal().then(() => {
            if (typeof onDecline === 'function') {
                onDecline(payload);
            }
        });
    };

    closeReviewModal = () => {
        const { onClose } = this.props;

        // emit sign requests update
        setTimeout(() => {
            PushNotificationsService.emit('signRequestUpdate');
        }, 1000);

        Navigator.dismissModal().then(() => {
            if (typeof onClose === 'function') {
                onClose();
            }
        });
    };

    onClose = () => {
        const { payload } = this.props;
        const { isValidPayload } = this.state;

        // dismiss keyboard if it's present
        Keyboard.dismiss();

        // if payload generated by Xaman or payload is not valid close it immediately
        if (payload.isGenerated() || !isValidPayload) {
            this.closeReviewModal();
            // if the payload origin is xApp or payload is a Pseudo transaction then directly decline the request
        } else if (payload.getOrigin() === PayloadOrigin.XAPP || payload.isPseudoTransaction()) {
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
            this.setState({ isLoading: true });

            // validate payload by fetching it again
            try {
                if (!payload.isGenerated()) {
                    await payload.validate();
                }
            } catch (e: any) {
                if (this.mounted) {
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
                }

                return;
            }

            try {
                // if any validation set to the transaction run and check
                // ignore if multiSign
                const validation = ValidationFactory.fromType(transaction.Type);
                if (
                    transaction instanceof BaseTransaction &&
                    typeof validation === 'function' &&
                    !payload.isMultiSign()
                ) {
                    await validation(transaction, source);
                }
            } catch (validationError: any) {
                if (this.mounted) {
                    Navigator.showAlertModal({
                        type: 'error',
                        text: validationError.message,
                        buttons: [
                            {
                                text: Localize.t('global.ok'),
                                type: 'dismiss',
                            },
                        ],
                    });
                }
                return;
            }

            // user may close the page at this point
            // we need to return if component is not mounted
            if (!this.mounted) {
                return;
            }

            // account is not activated and want to sign a tx
            // ignore for "Import" transaction as it can be submitted even if account is not activated
            if (
                !payload.isPseudoTransaction() &&
                // @ts-ignore
                ![TransactionTypes.Import].includes(transaction.Type) &&
                !payload.isMultiSign() &&
                source.balance === 0
            ) {
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
            if (transaction.Type === TransactionTypes.AccountDelete) {
                Navigator.showAlertModal({
                    type: 'error',
                    title: Localize.t('global.danger'),
                    text: Localize.t('account.deleteAccountWarning', {
                        ownerReserve: NetworkService.getNetworkReserve().OwnerReserve,
                        nativeAsset: NetworkService.getNativeAsset(),
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
            if (transaction.Type === TransactionTypes.TrustSet) {
                // if the token is not in the vetted list and user is creating new trust line
                // show the warning
                if (
                    !CurrencyRepository.isVettedCurrency({
                        issuer: transaction.Issuer,
                        currency: transaction.Currency,
                    }) &&
                    !AccountRepository.hasCurrency(source, {
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
            if (transaction.Type === TransactionTypes.OfferCreate) {
                let shouldShowAlert = false;

                const takerPays = transaction.TakerPays;

                if (takerPays.currency !== NetworkService.getNativeAsset()) {
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
            if (transaction.Type === TransactionTypes.AccountSet && transaction.SetFlag === 'asfDisableMaster') {
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

            if (transaction.Type === TransactionTypes.Payment) {
                try {
                    const destinationInfo = await getAccountInfo(transaction.Destination.address);

                    // if sending to a blackHoled account
                    if (destinationInfo.blackHole) {
                        Navigator.showAlertModal({
                            type: 'warning',
                            text: Localize.t('payload.paymentToBlackHoledAccountWarning'),
                            buttons: [
                                {
                                    text: Localize.t('global.cancel'),
                                    light: false,
                                },
                                {
                                    text: Localize.t('global.doIt'),
                                    onPress: this.prepareAndSignTransaction,
                                    type: 'dismiss',
                                    light: true,
                                },
                            ],
                        });
                        return;
                    }

                    // if sending native currency and destination
                    if (
                        (transaction.DeliverMin?.currency === NetworkService.getNativeAsset() ||
                            transaction.Amount.currency === NetworkService.getNativeAsset()) &&
                        destinationInfo.disallowIncomingXRP
                    ) {
                        Navigator.showAlertModal({
                            type: 'warning',
                            text: Localize.t('payload.paymentToDisallowedNativeAssetWarning', {
                                nativeAsset: NetworkService.getNativeAsset(),
                            }),
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
                } catch {
                    Toast(Localize.t('send.unableGetRecipientAccountInfoPleaseTryAgain'));
                    return;
                }
            }

            // if everything is fine prepare the transaction for signing
            this.prepareAndSignTransaction();
        } finally {
            if (this.mounted) {
                this.setState({
                    isLoading: false,
                });
            }
        }
    };

    setError = (error: Error) => {
        this.setState({
            hasError: true,
            errorMessage: error?.message,
        });
    };

    setTransaction = (tx: Transactions | PseudoTransactions) => {
        const { transaction } = this.state;

        if (transaction) {
            throw new Error('Transaction is already set and cannot be overwrite!');
        }

        this.setState({
            transaction: tx,
        });
    };

    setAccounts = (accounts: AccountModel[]) => {
        this.setState({
            accounts,
        });
    };

    setSource = (account: AccountModel) => {
        const { payload } = this.props;
        const { transaction } = this.state;

        // set the source account to transaction
        // ignore if the payload is multiSign
        if (!payload.isMultiSign()) {
            transaction.Account = { address: account.address };
        }

        // change state
        this.setState({
            source: account,
        });
    };

    setLoading = (loading: boolean) => {
        this.setState({
            isLoading: loading,
        });
    };

    setReady = (ready: boolean) => {
        this.setState({
            isReady: ready,
        });
    };

    submit = async () => {
        const { payload } = this.props;
        const { transaction, coreSettings } = this.state;

        // if not mounted
        if (!this.mounted) {
            return;
        }

        // in this phase transaction is already signed
        // check if we need to submit or not and patch the payload
        try {
            const { node, networkKey } = NetworkService.getConnectionDetails();
            // create patch object
            const payloadPatch = {
                signed_blob: transaction.SignedBlob,
                tx_id: transaction.Hash,
                signmethod: transaction.SignMethod,
                signpubkey: transaction.SignerPubKey,
                multisigned: payload.isMultiSign() ? transaction.SignerAccount : '',
                environment: {
                    nodeuri: node,
                    nodetype: networkKey,
                },
            } as PatchSuccessType;

            // patch the payload, before submitting (if necessary)
            payload.patch(payloadPatch);

            // check if we need to submit the payload to the Ledger
            if (payload.shouldSubmit()) {
                this.setState({
                    currentStep: Steps.Submitting,
                });

                // submit the transaction to the Ledger
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

                // patch the payload again with submit result
                payload.patch({
                    dispatched: {
                        to: submitResult.network.node,
                        nodetype: submitResult.network.key,
                        result: submitResult.engineResult,
                    },
                });

                this.setState({
                    submitResult,
                });
            }

            // emit sign requests update
            setTimeout(() => {
                PushNotificationsService.emit('signRequestUpdate');
            }, 1000);

            this.setState({
                currentStep: Steps.Result,
            });
        } catch (e) {
            if (this.mounted) {
                this.setState({
                    currentStep: Steps.Review,
                });
                if (typeof e.toString === 'function') {
                    Alert.alert(Localize.t('global.error'), e.toString());
                } else {
                    Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
                }
            }
        }
    };

    onFinish = () => {
        const { onResolve, payload } = this.props;
        const { transaction } = this.state;

        const returnURL = payload.getReturnURL();

        if (returnURL) {
            Linking.openURL(returnURL).catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('global.unableOpenReturnURL'));
            });
        }
        Navigator.dismissModal().then(() => {
            if (typeof onResolve === 'function') {
                onResolve(transaction, payload);
            }
        });
    };

    onPreflightPass = () => {
        this.setState({
            currentStep: Steps.Review,
            isLoading: false,
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
                    { backgroundColor: StyleService.value('$lightRed') },
                ]}
            >
                <Icon name="IconInfo" style={{ tintColor: StyleService.value('$red') }} size={70} />
                <Text style={[AppStyles.h5, { color: StyleService.value('$red') }]}>{Localize.t('global.error')}</Text>
                <Spacer size={20} />
                <InfoMessage
                    type="error"
                    labelStyle={[AppStyles.p, AppStyles.bold]}
                    label={errorMessage || Localize.t('payload.unexpectedPayloadErrorOccurred')}
                />
                <Spacer size={40} />
                <Button testID="back-button" label={Localize.t('global.back')} onPress={this.onDecline} />
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
            case Steps.Preflight:
                Step = PreflightStep;
                break;
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
                    setTransaction: this.setTransaction,
                    setAccounts: this.setAccounts,
                    setSource: this.setSource,
                    setError: this.setError,
                    setLoading: this.setLoading,
                    setReady: this.setReady,
                    onPreflightPass: this.onPreflightPass,
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
