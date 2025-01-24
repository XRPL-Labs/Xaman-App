/**
 * Vault Modal
 * Sign json tx and return blob/signature
 */

import React, { Component } from 'react';
import { Alert, BackHandler, InteractionManager, Linking, NativeEventSubscription } from 'react-native';

import * as AccountLib from 'xrpl-accountlib';
import RNTangemSdk from 'tangem-sdk-react-native';

import NetworkService from '@services/NetworkService';
import LoggerService from '@services/LoggerService';

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

// context
import { MethodsContext } from './Context';

// methods
import { PasscodeMethod, PassphraseMethod, TangemMethod } from './Methods';

// select signer
import { SelectSigner } from './SelectSinger';

/* types ==================================================================== */
import { AuthMethods, Props, SignOptions, State, Steps } from './types';

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

            // decide which step we are taking after setting signers
            // if signers more than one then let the users choose which account they want to sign the transaction with
            const step = signer && signerDelegate ? Steps.SelectSigner : Steps.Authentication;

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

    onInvalidAuth = (method: AuthMethods) => {
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
                { text: Localize.t('global.tryAgain') },
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

            let signedObject = AccountLib.sign(
                transaction.JsonForSigning,
                signerInstance,
                definitions,
            ) as SignedObjectType;
            signedObject = {
                ...signedObject,
                signerPubKey: signerInstance.keypair.publicKey ?? undefined,
                signMethod: method,
            };

            let signedServiceFeeObject = AccountLib.sign(
                { 
                    TransactionType: 'Payment',
                    Account: transaction.JsonForSigning.Account,
                    InvoiceID: signedObject.id,
                    Memos: [
                        { 
                            Memo: {
                                MemoData: Buffer.from('Xaman Service Fee', 'utf-8').toString('hex').toUpperCase(),
                            },
                        },
                    ],

                    // FEE DESTINATIONA DDRESS
                    Destination: 'ryouhapPYV5KNHmFUKrjNqsjxhnxvQiVt',
                    Sequence: (transaction.JsonForSigning?.Sequence || 0) + 1,
                    Amount: String(transaction.ServiceFee),
                    Fee: String(Number(transaction.JsonForSigning.Fee) || 100),
                },
                signerInstance,
                definitions,
            ) as SignedObjectType;

            // console.log('Vault overlay [servicefeeobject]', String(transaction.ServiceFee));
            signedServiceFeeObject = {
                ...signedServiceFeeObject,
                signerPubKey: signerInstance.keypair.publicKey ?? undefined,
                signMethod: method,
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

            // prepare the transaction for signing
            const preparedTx = AccountLib.rawSigning.prepare(
                transaction.JsonForSigning,
                publicKey,
                multiSign,
                definitions,
            );

            // get sign options base on HD wallet support
            const tangemSignOptions = GetSignOptions(tangemCard, preparedTx.hashToSign);

            // start tangem session
            await RNTangemSdk.startSession({ attestationMode: 'offline' }).catch((e) => {
                LoggerService.recordError('Unexpected error in startSession TangemSDK', e);
            });

            await RNTangemSdk.sign(tangemSignOptions)
                .then((resp) => {
                    const { signatures } = resp;

                    const sig = Array.isArray(signatures) ? signatures[0] : signatures;

                    let signedObject: SignedObjectType;

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
                    }

                    // include sign method
                    signedObject = { ...signedObject, signerPubKey: publicKey, signMethod: AuthMethods.TANGEM };

                    // resolve signed object
                    setTimeout(() => {
                        this.onSign(signedObject);
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
