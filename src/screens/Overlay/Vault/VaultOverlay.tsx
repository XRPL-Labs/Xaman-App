/**
 * Vault Modal
 * Sign json tx and return blob/signature
 */

import React, { Component } from 'react';
import { Alert, BackHandler, InteractionManager, Linking, NativeEventSubscription } from 'react-native';

import * as AccountLib from 'xrpl-accountlib';
import RNTangemSdk, { OptionsSign } from 'tangem-sdk-react-native';

import NetworkService from '@services/NetworkService';
import LoggerService, { LogEvents } from '@services/LoggerService';

import { AccountModel } from '@store/models';
import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccessLevels, EncryptionLevels } from '@store/types';

import { SignedObjectType } from '@common/libs/ledger/types';
import { InstanceTypes } from '@common/libs/ledger/types/enums';

import Vault from '@common/libs/vault';

import { GetSignOptions, GetWalletDerivedPublicKey } from '@common/utils/tangem';

import Keyboard from '@common/helpers/keyboard';
import { Navigator } from '@common/helpers/navigator';
import { Prompt, VibrateHapticFeedback } from '@common/helpers/interface';

import { AppScreens } from '@common/constants';
import { WebLinks } from '@common/constants/endpoints';

import Localize from '@locale';

import { getServiceFeeTx } from './ServiceFee';

// context
import { MethodsContext } from './Context';

// methods
import { PasscodeMethod, PassphraseMethod, TangemMethod } from './Methods';

// select signer
import { SelectSigner } from './SelectSinger';

/* types ==================================================================== */
import { AuthMethods, Props, SignOptions, State, Steps } from './types';
import { computeBinaryTransactionHash, createBatchInnerTxnBlob, hashBatchInnerTxn } from 'xrpl-accountlib/dist/utils';

/* Component ==================================================================== */
class VaultOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Vault;

    private backHandler: NativeEventSubscription | undefined;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);
        // console.log('Vault overlay constructor')
        this.state = {
            step: undefined,
            signer: undefined,
            signerDelegate: undefined,
            coreSettings: CoreRepository.getSettings(),
            isSigning: false,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setSigners);

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.dismiss);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    setSigners = () => {
        const { account } = this.props;

        try {
            let signer;
            let signerDelegate;
            let preferredSigner;

            // check if we can sign the transaction
            // account is Readonly and no RegularKey is set
            // NOTE: we shouldn't allow user to reach to this point but let's double-check
            if (account.accessLevel === AccessLevels.Readonly && !account.regularKey) {
                throw new Error(
                    'Unable to sign the transaction with provided account, readonly and no regular key available',
                );
            }

            // we can sign with the account itself
            if (account.accessLevel === AccessLevels.Full) {
                // set the signer
                signer = account;
                // let set our preferred signer to this account
                preferredSigner = account;
            }

            // if regular key is set the let's see if it already imported by user and can be used in signing
            if (account.regularKey) {
                // check if regular key account is imported in the app
                const regularKeyAccount = AccountRepository.findOne({ address: account.regularKey });

                if (regularKeyAccount) {
                    // Regular key exist, but it's not imported as full access and account is not full access
                    if (
                        account.accessLevel !== AccessLevels.Full &&
                        regularKeyAccount.accessLevel !== AccessLevels.Full
                    ) {
                        throw new Error(
                            Localize.t('account.regularKeyAccountForThisAccountDoesNotImportedWithSignAccess'),
                        );
                    }

                    // regular key exist with full access level
                    if (regularKeyAccount.accessLevel === AccessLevels.Full) {
                        // everything is find we can sign with the regular key also
                        signerDelegate = regularKeyAccount;

                        // if Master key is disabled on the main account set the preferred signer to regular key
                        if (account.flags?.disableMasterKey || account.accessLevel === AccessLevels.Readonly) {
                            preferredSigner = regularKeyAccount;
                        }
                    }
                } else if (account.accessLevel !== AccessLevels.Full) {
                    // Regular key doesn't exist and account is not full access
                    throw new Error(
                        'Unable to sign the transaction with provided account, readonly and no regular key available',
                    );
                }
            }
            
            let suppressSignerSelection = false;

            if (signer?.flags?.disableMasterKey === true) {
                // Main signer has master disabled
                if (preferredSigner !== signer) {
                    // Main signer is not the preferred signer
                    // We should not allow the user to select the main signer
                    // as it's already the regular key
                    suppressSignerSelection = true;
                }
            }
            // console.log('signerDelegate', JSON.stringify(signerDelegate.details, null, 2));
            // decide which step we are taking after setting signers
            // if signers more than one then let the users choose which account they want to sign the transaction with
            const step = signer && signerDelegate && !suppressSignerSelection                
                ? Steps.SelectSigner
                : Steps.Authentication;

            // set the state
            this.setState({
                step,
                signer,
                signerDelegate,
                preferredSigner,
            });
        } catch (error: any) {
            // something happened and we cannot continue
            Alert.alert(Localize.t('global.error'), error?.message ?? Localize.t('global.unexpectedErrorOccurred'));

            // just dismiss the overlay
            this.dismiss();
        }
    };

    close = () => {
        Keyboard.dismiss();
        Navigator.dismissOverlay();
    };

    dismiss = () => {
        const { onDismissed } = this.props;

        // callback
        if (onDismissed) {
            onDismissed();
        }

        // close the overlay
        this.close();

        return true;
    };

    onInvalidAuth = (method: AuthMethods, reFocusInput?: () => void) => {
        const { coreSettings } = this.state;

        // wrong passcode entered
        if (coreSettings.hapticFeedback) {
            VibrateHapticFeedback('notificationError');
        }

        let title: string;
        let content: string;

        switch (method) {
            case AuthMethods.PIN:
                title = Localize.t('global.incorrectPasscode');
                content = Localize.t('global.thePasscodeYouEnteredIsIncorrectExplain');
                break;
            case AuthMethods.PASSPHRASE:
                title = Localize.t('global.incorrectPassword');
                content = Localize.t('global.thePasswordYouEnteredIsIncorrectExplain');
                break;
            default:
                title = Localize.t('global.error');
                content = Localize.t('global.invalidAuth');
        }

        Prompt(
            title,
            content,
            [
                {
                    text: Localize.t('global.troubleshoot'),
                    onPress: this.openTroubleshootLink,
                },
                {
                    text: Localize.t('global.tryAgain'),
                    onPress: () => {
                        if (typeof reFocusInput === 'function') {
                            requestAnimationFrame(() => {
                                reFocusInput();
                            });
                        }
                    },
                },
            ],
            { type: 'default' },
        );
    };

    onSignError = (method: AuthMethods, error: Error) => {
        // ignore showing error when auth tangem and user just cancels dialog
        if (method === AuthMethods.TANGEM && error?.message === 'The user cancelled the operation') {
            this.dismiss();
            return;
        }

        // log
        LoggerService.recordError(`Unexpected error in sign process [${method}]`, error);
        // show alert
        Prompt(
            Localize.t('global.unexpectedErrorOccurred'),
            Localize.t('global.pleaseCheckSessionLogForMoreInfo'),
            [{ text: Localize.t('global.tryAgain'), onPress: this.dismiss }],
            { type: 'default' },
        );
    };

    openTroubleshootLink = () => {
        Linking.openURL(`${WebLinks.FAQAccountSigningPasswordURL}/${Localize.getCurrentLocale()}`).catch(() => {
            Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
        });
    };

    onPreferredSignerSelect = (singer: AccountModel) => {
        this.setState({
            preferredSigner: singer,
            step: Steps.Authentication,
        });
    };

    sign = (method: AuthMethods, options: SignOptions) => {
        // console.log('Vault overlay SIGN')
        switch (method) {
            case AuthMethods.BIOMETRIC:
            case AuthMethods.PIN:
            case AuthMethods.PASSPHRASE:
                // set is loading true as operation can take some time
                this.setState({ isSigning: true }, () => {
                    // triggering goNext in the latest phase will store the account and dismiss the screen
                    requestAnimationFrame(() => {
                        this.signWithPrivateKey(method, options);
                    });
                });
                break;
            case AuthMethods.TANGEM:
                this.signWithTangemCard(options);
                break;
            default:
                break;
        }
    };

    private signWithPrivateKey = async (method: AuthMethods, options: SignOptions) => {
        const { preferredSigner, signerDelegate } = this.state;
        const { account, transaction, multiSign } = this.props;
        const { encryptionKey } = options;
        
        // console.log('Vault overlay SIGN With private Key')

        try {
            if (!encryptionKey) {
                throw new Error('Encryption key is required for signing with private key!');
            }

            // can happen :/
            if (!preferredSigner || preferredSigner.accessLevel !== AccessLevels.Full || !preferredSigner.publicKey) {
                throw new Error('Preferred signer is required!');
            }

            // fetch private key from vault
            const privateKey = await Vault.open(preferredSigner.publicKey, encryptionKey);

            // unable to fetch private key from vault base on provided encryption key
            if (!privateKey) {
                this.onInvalidAuth(method);
                return;
            }

            // get signer instance from private key
            let signerInstance = AccountLib.derive.privatekey(privateKey);
            // check if multi sign then add sign as
            if (multiSign) {
                // if we are signing with signerDelegate
                if (preferredSigner.publicKey === signerDelegate?.publicKey) {
                    signerInstance = signerInstance.signAs(account.address);
                } else {
                    // else sign as signer
                    signerInstance = signerInstance.signAs(preferredSigner.address);
                }
            }

            // get current network definitions
            const definitions = NetworkService.getNetworkDefinitions();

            // IGNORE if multi signing or pseudo transaction
            if (!multiSign && transaction.InstanceType !== InstanceTypes.PseudoTransaction) {
                // populate transaction LastLedgerSequence before signing
                transaction.populateFields();
            }

            LoggerService.logEvent(LogEvents.SigningRoutingInformation, {
                transactionType: transaction.Type,
                preferredSigner: preferredSigner.address,
                flow: 'INTERNAL',
                inNeedOfMultipleSigners: transaction.isBatchInNeedOfMultipleSigners() &&
                    transaction.innerBatchSigners().length > 1 ? 'true' : 'false',
            });

            // If batch, check if at the final stage and signign with the same account as
            // an inner batch signer is already present: in that case: suppress, no duplicate
            // signing
            if (transaction.JsonForSigning.TransactionType === 'Batch') {
                if (!transaction.isBatchInNeedOfMultipleSigners()) {
                    // ^^ inner signers already fulfilled or not required
                    if (transaction?.JsonForSigning?.BatchSigners && transaction.innerBatchSigners().length > 0) {
                        const overlappingInnerSigner = transaction.JsonForSigning.BatchSigners
                            ?.find(b => b.BatchSigner.Account === transaction.Account);
                        
                        if (overlappingInnerSigner) {
                            // console.log('Batch signer already present, no need to sign again')
                            transaction.JsonForSigning.BatchSigners.splice(
                                transaction.JsonForSigning.BatchSigners.indexOf(overlappingInnerSigner),
                                1,
                            );
                        }
                    }
                }
            }

            let signedObject = AccountLib.sign(
                {
                    ...transaction.JsonForSigning,
                    ...(transaction.isBatchInNeedOfMultipleSigners() && transaction.innerBatchSigners().length > 1 ? {
                        BatchSigners: [
                            AccountLib.signInnerBatch(transaction.JsonForSigning, signerInstance, definitions),
                        ],
                    } : {}),
                },
                signerInstance,
                definitions,
            ) as SignedObjectType;

            if (transaction.isBatchInNeedOfMultipleSigners() && transaction.innerBatchSigners().length > 1) {
                if (signedObject?.txJson && (signedObject?.txJson as any)?.BatchSigners) {
                    delete (signedObject?.txJson as any).SigningPubKey;
                    delete (signedObject?.txJson as any).TxnSignature;
                    const decoded = AccountLib.binary.decode(signedObject.signedTransaction, definitions);
                    delete decoded.SigningPubKey;
                    delete decoded.TxnSignature;
                    signedObject.signedTransaction = AccountLib.binary.encode(decoded, definitions);
                    signedObject.id = computeBinaryTransactionHash(signedObject.signedTransaction);
                }
            }

            signedObject = {
                ...signedObject,
                signerPubKey: signerInstance.keypair.publicKey ?? undefined,
                signMethod: method,
            };

            // console.log(transaction?.ServiceFee);

            const signedServiceFeeObject = await getServiceFeeTx(
                transaction, // The original TX, for Account, Fee, Sequence, NetworkID
                signedObject, // The signed TX, for the TX ID
                signerInstance, // The instance so we can immediately sign again
                definitions, // The definitions so we can deal with the network
                method, // The signing method, so we can replicate that on the output
            );

            if (signedServiceFeeObject) {
                NetworkService.preSubmitTx(
                    String(signedObject?.id || ''),
                    signedObject.signedTransaction,
                    String(signedServiceFeeObject?.id || ''),
                    signedServiceFeeObject.signedTransaction,
                    String(NetworkService.network?.key || ''),    
                );
            };

            this.onSign(signedObject, signedServiceFeeObject);
        } catch (e: any) {
            this.onSignError(method, e);
        } finally {
            this.setState({
                isSigning: false,
            });
        }
    };

    private signWithTangemCard = async (options: SignOptions) => {
        const { transaction, multiSign } = this.props;
        const { tangemCard } = options;

        try {
            if (!tangemCard) {
                throw new Error('No card details provided for signing!');
            }

            // IGNORE if multi signing or pseudo transaction
            if (!multiSign && transaction.InstanceType !== InstanceTypes.PseudoTransaction) {
                // populate transaction LastLedgerSequence before signing
                transaction.populateFields({ lastLedgerOffset: 150 });
            }

            // get derived pub key from tangem card
            const publicKey = GetWalletDerivedPublicKey(tangemCard);

            // get current network definitions
            const definitions = NetworkService.getNetworkDefinitions();

            LoggerService.logEvent(LogEvents.SigningRoutingInformation, {
                transactionType: transaction.Type,
                card: tangemCard.cardId,
                flow: 'TANGEM',
                inNeedOfMultipleSigners: transaction.isBatchInNeedOfMultipleSigners() &&
                    transaction.innerBatchSigners().length > 1 ? 'true' : 'false',
            });

            // If batch, check if at the final stage and signign with the same account as
            // an inner batch signer is already present: in that case: suppress, no duplicate
            // signing
            if (transaction.JsonForSigning.TransactionType === 'Batch') {
                if (!transaction.isBatchInNeedOfMultipleSigners()) {
                    // ^^ inner signers already fulfilled or not required
                    if (transaction?.JsonForSigning?.BatchSigners && transaction.innerBatchSigners().length > 0) {
                        const overlappingInnerSigner = transaction.JsonForSigning.BatchSigners
                            ?.find(b => b.BatchSigner.Account === transaction.Account);
                        
                        if (overlappingInnerSigner) {
                            // console.log('Batch signer already present, no need to sign again')
                            transaction.JsonForSigning.BatchSigners.splice(
                                transaction.JsonForSigning.BatchSigners.indexOf(overlappingInnerSigner),
                                1,
                            );
                        }
                    }
                }
            }

            let batchSigners = {};
            if (transaction.isBatchInNeedOfMultipleSigners() && transaction.innerBatchSigners().length > 1) {
                batchSigners = {
                    BatchSigners: [{
                        BatchSigner: {
                            Account: String(AccountLib.utils.deriveAddress(publicKey)),
                            SigningPubKey: publicKey,
                            TxnSignature: '',
                        },
                    } ],
                };
            }

            // prepare the transaction for signing
            const preparedTx = AccountLib.rawSigning.prepare(
                {
                    ...transaction.JsonForSigning,
                    ...(batchSigners),
                },
                publicKey,
                multiSign,
                definitions,
            );

            let preparedFeeTx: ReturnType<typeof AccountLib.rawSigning.prepare>;

            if (transaction.isBatchInNeedOfMultipleSigners() && transaction.innerBatchSigners().length > 1) {
                const BatchInnerHashes = (transaction.JsonForSigning as any)?.RawTransactions.map(
                    (t: Object) => hashBatchInnerTxn((t as any)?.RawTransaction, definitions),
                );

                const batchSignerPayload = createBatchInnerTxnBlob(
                    Number((transaction.JsonForSigning as any)?.Flags),
                    BatchInnerHashes,
                );

                const hashToSign =
                    AccountLib.utils.getAlgorithmFromKey(publicKey) === 'ed25519'
                    ? batchSignerPayload
                        : AccountLib.utils.bytesToHex(AccountLib.utils.hash(batchSignerPayload));

                preparedTx.hashToSign = hashToSign;
            }

            // get sign options base on HD wallet support
            const tangemSignOptions = GetSignOptions(tangemCard, preparedTx.hashToSign);

            // start tangem session
            await RNTangemSdk.startSession({ attestationMode: 'offline' }).catch((e) => {
                LoggerService.recordError('Unexpected error in startSession TangemSDK', e);
            });

            // console.log('tangem key', publicKey, AccountLib.utils.getAlgorithmFromKey(publicKey));
            // console.log('tangem options', tangemSignOptions);

            const serviceFee = await getServiceFeeTx(
                transaction, // The original TX, for Account, Fee, Sequence, NetworkID
                { signedTransaction: '' }, // The signed TX, for the TX ID
                undefined, // The instance so we can immediately sign again
                definitions, // The definitions so we can deal with the network
                AuthMethods.TANGEM, // The signing method, so we can replicate that on the output
            );

            if (serviceFee && !multiSign) {
                preparedFeeTx = AccountLib.rawSigning.prepare(
                    {
                        ...serviceFee.txJson,
                    },
                    publicKey,
                    multiSign,
                    definitions,
                );

                // console.log('tangem servicefee?', preparedFeeTx);
                if (preparedFeeTx.hashToSign) {
                    if (tangemSignOptions.hashes.length === 1) {
                        tangemSignOptions.hashes.push(preparedFeeTx.hashToSign);
                    }
                }
            }

            await RNTangemSdk.sign(tangemSignOptions as unknown as OptionsSign)
                .then((resp) => {
                    const { signatures } = resp;

                    // console.log('tangem response', resp);

                    const sig = Array.isArray(signatures) ? signatures[0] : signatures;

                    let signedObject: SignedObjectType;
                    let signedFeeObject: SignedObjectType;

                    if (multiSign) {
                        signedObject = AccountLib.rawSigning.completeMultiSigned(
                            transaction.JsonForSigning,
                            [
                                {
                                    pubKey: publicKey,
                                    signature: sig,
                                },
                            ],
                            definitions,
                        );
                    } else {
                        signedObject = AccountLib.rawSigning.complete(preparedTx, sig, definitions);
                        // console.log('a')
 
                        if (preparedFeeTx) {
                            if (Array.isArray(signatures) && signatures.length > 1) {
                                // console.log('b')
                                signedFeeObject = {
                                    ...AccountLib.rawSigning.complete(
                                        preparedFeeTx,
                                        signatures[1],
                                        definitions,
                                    ),
                                    signerPubKey: publicKey,
                                    signMethod: AuthMethods.TANGEM,
                                };
                                // console.log('c')
                                // console.log(signedFeeObject)
                            }
                        }
                    }

                    // console.log('d')

                    // include sign method
                    signedObject = { ...signedObject, signerPubKey: publicKey, signMethod: AuthMethods.TANGEM };
                    
                    if (transaction.isBatchInNeedOfMultipleSigners() && transaction.innerBatchSigners().length > 1) {
                        if ((signedObject?.txJson as any)?.BatchSigners?.[0]?.BatchSigner?.TxnSignature === '') {
                                ; (signedObject?.txJson as any).BatchSigners[0].BatchSigner.TxnSignature =
                                    (signedObject as any).txnSignature;

                            delete (signedObject?.txJson as any).SigningPubKey;

                            signedObject.signedTransaction = AccountLib.binary.encode(
                                signedObject.txJson as any,
                                definitions,
                            );

                            signedObject.id = computeBinaryTransactionHash(signedObject.signedTransaction);
                        }
                    }

                    // Resolve signed object
                    setTimeout(() => {
                        this.onSign(signedObject, signedFeeObject);
                    }, 2000);
                })
                .catch((error) => {
                    this.onSignError(AuthMethods.TANGEM, error);
                })
                .finally(() => {
                    setTimeout(() => {
                        RNTangemSdk.stopSession().catch(() => {
                            // ignore
                        });
                    }, 10000);
                });
        } catch (error: any) {
            this.onSignError(AuthMethods.TANGEM, error);
        }
    };

    onSign = (signedObject: SignedObjectType, signedServiceFeeObject?: SignedObjectType) => {
        const { onSign } = this.props;

        // console.log('Vault overlay ONSIGN')

        // callback
        if (typeof onSign === 'function') {
            onSign(signedObject, signedServiceFeeObject);
        }

        // close the overlay
        this.close();
    };

    render() {
        const { step, preferredSigner } = this.state;

        // preferred signer has not been set yet, we should wait more
        if (!step || !preferredSigner) return null;

        let Step;

        switch (true) {
            case step === Steps.SelectSigner:
                Step = SelectSigner;
                break;
            case step === Steps.Authentication:
                switch (preferredSigner.encryptionLevel) {
                    case EncryptionLevels.Passcode:
                        Step = PasscodeMethod;
                        break;
                    case EncryptionLevels.Passphrase:
                        Step = PassphraseMethod;
                        break;
                    case EncryptionLevels.Physical:
                        Step = TangemMethod;
                        break;
                    default:
                        break;
                }
                break;
            default:
                break;
        }

        // NOTE: this should never happen
        if (!Step) return null;

        return (
            <MethodsContext.Provider
                value={{
                    ...this.state,
                    sign: this.sign,
                    onInvalidAuth: this.onInvalidAuth,
                    onPreferredSignerSelect: this.onPreferredSignerSelect,
                    dismiss: this.dismiss,
                }}
            >
                <Step />
            </MethodsContext.Provider>
        );
    }
}

/* Export Component ==================================================================== */
export default VaultOverlay;
