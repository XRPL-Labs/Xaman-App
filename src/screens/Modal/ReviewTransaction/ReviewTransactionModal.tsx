/**
 * Review Transaction Screen
 */

import React, { Component } from 'react';
import { Alert, BackHandler, Keyboard, Linking, NativeEventSubscription } from 'react-native';

import { AppScreens } from '@common/constants';

import { NetworkService, PushNotificationsService, ResolverService } from '@services';

import { AccountRepository, CoreRepository, CurrencyRepository } from '@store/repositories';
import { AccountModel } from '@store/models';

import { TransactionTypes } from '@common/libs/ledger/types/enums';

import { MutatedTransaction, SignableTransaction } from '@common/libs/ledger/transactions/types';
import ValidationFactory from '@common/libs/ledger/factory/validation';

import { PatchSuccessType, PayloadOrigin } from '@common/libs/payload';

import { Toast, VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import Localize from '@locale';

import { RequestDeclineOverlayProps } from '@screens/Overlay/RequestDecline';

import { PreflightStep, ResultStep, ReviewStep, SubmittingStep } from './Steps';
import ErrorView from './Shared/ErrorView';

import { StepsContext } from './Context';
import { Props, State, Steps } from './types';

/* Component ==================================================================== */
class ReviewTransactionModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.ReviewTransaction;

    private backHandler: NativeEventSubscription | undefined;
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

        // TODO: transaction!
        await transaction!
            // TODO: source!
            .sign(source!, payload.isMultiSign())
            .then(this.submit)
            .catch((error: Error) => {
                if (this.mounted) {
                    if (error) {
                        if (error?.message) {
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
            Navigator.showOverlay<RequestDeclineOverlayProps>(AppScreens.Overlay.RequestDecline, {
                onDecline: this.onDecline,
                onClose: this.closeReviewModal,
            });
        }
    };

    onAccept = async () => {
        const { payload } = this.props;
        const { source, transaction } = this.state;

        if (!transaction || !source) {
            throw new Error('Transaction and Source instance is required!');
        }

        try {
            // set loading
            this.setState({ isLoading: true });

            // validate payload by fetching it again
            try {
                if (!payload.isGenerated()) {
                    await payload.validate();
                }
            } catch (payloadValidationError: any) {
                if (this.mounted) {
                    Navigator.showAlertModal({
                        type: 'error',
                        text: payloadValidationError.message,
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
                const validation = ValidationFactory.fromTransaction(transaction!);
                if (typeof validation === 'function' && !payload.isMultiSign() && payload.shouldSubmit()) {
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
                transaction.Type !== TransactionTypes.Import &&
                !payload.isMultiSign() &&
                source!.balance === 0
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

                if (takerPays && takerPays.currency !== NetworkService.getNativeAsset()) {
                    if (
                        !CurrencyRepository.isVettedCurrency({
                            issuer: takerPays.issuer!,
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
                    const destinationInfo = await ResolverService.getAccountAdvisoryInfo(transaction.Destination);

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
                            transaction.Amount?.currency === NetworkService.getNativeAsset()) &&
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
            await this.prepareAndSignTransaction();
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

    setTransaction = (tx: SignableTransaction & MutatedTransaction) => {
        const { transaction } = this.state;

        // we shouldn't override already set transaction
        if (transaction) {
            throw new Error('Transaction is already set and cannot be overwrite!');
        }

        this.setState({
            transaction: tx,
        });
    };

    /*
    Set available accounts for signing
    */
    setAccounts = (accounts: AccountModel[]) => {
        this.setState({
            accounts,
        });
    };

    /*
    Set selected account to the transaction
    */
    setSource = (account: AccountModel) => {
        const { payload } = this.props;
        const { transaction } = this.state;

        if (!transaction) {
            throw new Error('Transaction is not set and cannot set source account!');
        }

        // assign the source account address to transaction Account field
        // ignore if the payload is multiSign || Import transaction

        // NOTE: in some specific case the Import transaction can only be signed with regularKey account
        // As the Master account is imported as readonly and transaction can only be signed by regular key
        // we should not override the Account field, we should show the actual account
        if (!payload.isMultiSign() && transaction.Type !== TransactionTypes.Import) {
            transaction.Account = account.address;
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

        if (!transaction) {
            throw new Error('Transaction is not set and cannot be submitted!');
        }

        // in this phase transaction is already signed
        // check if we need to submit or not and patch the payload
        try {
            const { node, networkKey } = NetworkService.getConnectionDetails();
            // create patch object
            const payloadPatch = {
                signed_blob: transaction.SignedBlob,
                tx_id: transaction.hash,
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
                        to: submitResult.network?.node || 'UNKNOWN NODE',
                        nodetype: submitResult.network?.key ?? 'UNKNOWN NODE',
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
        } catch (error: any) {
            if (this.mounted) {
                this.setState({
                    currentStep: Steps.Review,
                });
                if (typeof error?.message === 'string') {
                    Alert.alert(Localize.t('global.error'), error.message);
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
                onResolve(transaction!, payload);
            }
        });
    };

    onPreflightPass = () => {
        this.setState({
            currentStep: Steps.Review,
            isLoading: false,
        });
    };

    render() {
        const { currentStep, hasError, errorMessage } = this.state;

        // don't render if any error happened
        // this can happen if there is a missing field in the payload or any unexpected error
        if (hasError) {
            return <ErrorView onBackPress={this.onDecline} errorMessage={errorMessage} />;
        }

        let Step;

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

        if (!Step) {
            throw new Error('Invalid Step in ReviewTransaction!');
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
                }}
            >
                <Step />
            </StepsContext.Provider>
        );
    }
}

/* Export Component ==================================================================== */
export default ReviewTransactionModal;
