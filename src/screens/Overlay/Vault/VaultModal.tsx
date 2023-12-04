/**
 * Vault Modal
 * Sign json tx and return blob/signature
 */

import React, { Component } from 'react';
import { Alert, BackHandler, InteractionManager, Linking, NativeEventSubscription } from 'react-native';

import * as AccountLib from 'xrpl-accountlib';
import RNTangemSdk from 'tangem-sdk-react-native';

import { BaseTransaction } from '@common/libs/ledger/transactions';

import NetworkService from '@services/NetworkService';
import LoggerService from '@services/LoggerService';

import { AccountModel } from '@store/models';
import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccessLevels, EncryptionLevels } from '@store/types';

import { SignedObjectType } from '@common/libs/ledger/types';

import Vault from '@common/libs/vault';

import { GetSignOptions, GetWalletDerivedPublicKey } from '@common/utils/tangem';

import Keyboard from '@common/helpers/keyboard';
import { Navigator } from '@common/helpers/navigator';
import { Prompt, VibrateHapticFeedback } from '@common/helpers/interface';

import { AppScreens } from '@common/constants';

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
class VaultModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Vault;

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
            step: undefined,
            signers: undefined,
            preferredSigner: undefined,
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
            const signers: AccountModel[] = [];
            let preferredSigner;

            // check if we can sign the transaction with provided account
            // account is Readonly and no RegularKey is set
            // NOTE: we shouldn't allow user to reach to this point but we are double-checking
            if (account.accessLevel === AccessLevels.Readonly && !account.regularKey) {
                throw new Error('Unable to sign the transaction with provided account');
            }

            // by default include the provided account if full access
            if (account.accessLevel === AccessLevels.Full) {
                signers.push(account);
                preferredSigner = account;
            }

            // if regular key is set to the account then we check if we should include it in the list of signer
            if (account.regularKey) {
                // check if regular key account is imported in the app
                const regularKeyAccount = AccountRepository.findOne({ address: account.regularKey });

                // Master key is disabled and the regular key is not present is the app
                if (account.flags?.disableMasterKey && !regularKeyAccount) {
                    throw new Error(Localize.t('account.masterKeyForThisAccountDisableRegularKeyNotFound'));
                }

                // Regular key exist but it's not imported as full access
                if (regularKeyAccount.accessLevel !== AccessLevels.Full) {
                    throw new Error(Localize.t('account.regularKeyAccountForThisAccountDoesNotImportedWithSignAccess'));
                }

                // everything is find we can sign with the regular key beside the main account
                signers.push(regularKeyAccount);

                // if Master key is disabled on the main account set the preferred Signer to regular key
                if (account.flags?.disableMasterKey || account.accessLevel === AccessLevels.Readonly) {
                    preferredSigner = regularKeyAccount;
                }
            }

            // decide which step we are taking after setting signers
            // if signers more than one then let user to select which account they want to sign the transaction with
            const step = signers.length > 1 ? Steps.SelectSigner : Steps.Authentication;

            // set the state
            this.setState({
                step,
                signers,
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
        const url = `https://xumm.app/redir/faq/account-signing-password/${Localize.getCurrentLocale()}`;
        Linking.openURL(url).catch(() => {
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
        const { preferredSigner } = this.state;
        const { transaction, multiSign } = this.props;
        const { encryptionKey } = options;

        try {
            if (!encryptionKey) {
                throw new Error('Encryption key is required for signing with private key!');
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
                signerInstance = signerInstance.signAs(preferredSigner.address);
            }

            // get current network definitions
            const definitions = NetworkService.getNetworkDefinitions();

            // IGNORE if multi signing or pseudo transaction
            if (!multiSign && transaction instanceof BaseTransaction) {
                // populate transaction LastLedgerSequence before signing
                transaction.populateFields();
            }

            let signedObject = AccountLib.sign(transaction.Json, signerInstance, definitions) as SignedObjectType;
            signedObject = { ...signedObject, signerPubKey: signerInstance.keypair.publicKey, signMethod: method };

            this.onSign(signedObject);
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
            if (!multiSign && transaction instanceof BaseTransaction) {
                // populate transaction LastLedgerSequence before signing
                transaction.populateFields({ lastLedgerOffset: 150 });
            }

            // get derived pub key from tangem card
            const publicKey = GetWalletDerivedPublicKey(tangemCard);

            // get current network definitions
            const definitions = NetworkService.getNetworkDefinitions();

            // prepare the transaction for signing
            const preparedTx = AccountLib.rawSigning.prepare(transaction.Json, publicKey, multiSign, definitions);

            // get sign options base on HD wallet support
            const tangemSignOptions = GetSignOptions(tangemCard, preparedTx.hashToSign);

            // start tangem session
            await RNTangemSdk.startSession({ attestationMode: 'offline' }).catch((e) => {
                LoggerService.recordError('Unexpected error in startSession TangemSDK', e);
            });

            await RNTangemSdk.sign(tangemSignOptions)
                .then((resp) => {
                    const { signatures } = resp;

                    const sig = signatures instanceof Array ? signatures[0] : signatures;

                    let signedObject = undefined as SignedObjectType;

                    if (multiSign) {
                        signedObject = AccountLib.rawSigning.completeMultiSigned(
                            transaction.Json,
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

    onSign = (signedObject: SignedObjectType) => {
        const { onSign } = this.props;

        // callback
        if (typeof onSign === 'function') {
            onSign(signedObject);
        }

        // close the overlay
        this.close();
    };

    render() {
        const { step, preferredSigner } = this.state;

        // preferred signer has not been set yet, we should wait more
        if (!step || !preferredSigner) return null;

        let Step = null;

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
export default VaultModal;
