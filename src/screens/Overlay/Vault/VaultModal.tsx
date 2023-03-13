/**
 * Vault Modal
 * Sign json tx and return blob/signature
 */

import React, { Component } from 'react';
import { Alert, Linking, BackHandler, InteractionManager, NativeEventSubscription } from 'react-native';

import * as AccountLib from 'xrpl-accountlib';
import RNTangemSdk from 'tangem-sdk-react-native';

import LoggerService from '@services/LoggerService';

import { CoreRepository, AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';
import { AccessLevels, EncryptionLevels } from '@store/types';

import Flag from '@common/libs/ledger/parser/common/flag';
import { SignedObjectType } from '@common/libs/ledger/types';

import Vault from '@common/libs/vault';

import { GetSignOptions, GetWalletDerivedPublicKey } from '@common/utils/tangem';

import Keyboard from '@common/helpers/keyboard';
import { VibrateHapticFeedback, Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import Localize from '@locale';

// context
import { MethodsContext } from './Context';

// methods
import { PasscodeMethod, PassphraseMethod, TangemMethod } from './Methods';

/* types ==================================================================== */
import { Props, State, AuthMethods, SignOptions } from './types';

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
            signer: undefined,
            alternativeSigner: undefined,
            coreSettings: CoreRepository.getSettings(),
            isSigning: false,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setSignerAccount);

        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.dismiss);
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    setSignerAccount = () => {
        const { account } = this.props;

        // set signer by default
        let signer = account;
        let alternativeSigner;

        // check if regular key account is imported to XUMM
        if (account.regularKey) {
            // check if regular key is imported in XUMM
            const regularAccount = AccountRepository.findOne({ address: account.regularKey }) as AccountSchema;

            // check for account regular key set
            const flags = new Flag('Account', account.flags);
            const accountFlags = flags.parse();

            // check if we are able to sign this tx with signer or alternative signer
            if (accountFlags.disableMasterKey || account.accessLevel === AccessLevels.Readonly) {
                if (!regularAccount) {
                    Alert.alert(
                        Localize.t('global.error'),
                        Localize.t('account.masterKeyForThisAccountDisableRegularKeyNotFound'),
                    );
                    return;
                }

                if (regularAccount.accessLevel !== AccessLevels.Full) {
                    Alert.alert(
                        Localize.t('global.error'),
                        Localize.t('account.regularKeyAccountForThisAccountDoesNotImportedWithSignAccess'),
                    );
                    return;
                }

                // we should sign this tx with regular key as signer will not be able to sign it
                signer = regularAccount;
            } else if (regularAccount && regularAccount.accessLevel === AccessLevels.Full) {
                alternativeSigner = regularAccount;
            }
        }

        this.setState({
            signer,
            alternativeSigner,
        });
    };

    close = () => {
        Keyboard.dismiss();
        Navigator.dismissOverlay();
    };

    dismiss = () => {
        const { onDismissed } = this.props;

        if (onDismissed) {
            onDismissed();
        }

        this.close();
        return true;
    };

    onInvalidAuth = (method: AuthMethods) => {
        const { coreSettings } = this.state;

        // wrong passcode entered
        if (coreSettings.hapticFeedback) {
            VibrateHapticFeedback('notificationError');
        }

        let title = '';
        let content = '';

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

    onSignError = (method: AuthMethods, e: Error) => {
        // log
        LoggerService.recordError(`Unexpected error in sign process [${method}]`, e);
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

    sign = (method: AuthMethods, options: any) => {
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

    signWithPrivateKey = async (method: AuthMethods, options: SignOptions) => {
        const { signer } = this.state;
        const { transaction, multiSign } = this.props;
        const { encryptionKey } = options;

        try {
            if (!encryptionKey) {
                throw new Error('No encryption key provided!');
            }

            // fetch private key from vault
            const privateKey = await Vault.open(signer.publicKey, encryptionKey);

            // unable to fetch private key from vault base on provided encryption key
            if (!privateKey) {
                this.onInvalidAuth(method);
                return;
            }

            // get signer instance from private key
            let signerInstance = AccountLib.derive.privatekey(privateKey);
            // check if multi sign then add sign as
            if (multiSign) {
                signerInstance = signerInstance.signAs(signer.address);
            }

            // populate transaction LastLedgerSequence before signing
            // INGORE if multi signing
            if (!multiSign) {
                transaction.populateLastLedgerSequence();
            }

            let signedObject = AccountLib.sign(transaction.Json, signerInstance) as SignedObjectType;
            signedObject = { ...signedObject, signMethod: method };

            this.onSign(signedObject);
        } catch (e: any) {
            this.onSignError(method, e);
        } finally {
            this.setState({
                isSigning: false,
            });
        }
    };

    signWithTangemCard = async (options: SignOptions) => {
        const { transaction, multiSign } = this.props;
        const { tangemCard } = options;

        try {
            if (!tangemCard) {
                throw new Error('No card details provided for signing!');
            }

            // populate transaction LastLedgerSequence before signing
            // NOTE: as tangem signing can take a lot of time we increase gap to 150 ledger
            // INGORE if multi signing
            if (!multiSign) {
                transaction.populateLastLedgerSequence(150);
            }

            // get derived pub key from tangem card
            const publicKey = GetWalletDerivedPublicKey(tangemCard);

            // prepare the transaction for signing
            const preparedTx = AccountLib.rawSigning.prepare(transaction.Json, publicKey, multiSign);

            // get sign options base on HD wallet support
            const tangemSignOptions = GetSignOptions(tangemCard, preparedTx.hashToSign);

            // start tangem session
            await RNTangemSdk.startSession({}).catch(() => {
                // ignore
            });

            await RNTangemSdk.sign(tangemSignOptions)
                .then((resp) => {
                    const { signatures } = resp;

                    const sig = signatures instanceof Array ? signatures[0] : signatures;

                    let signedObject = undefined as SignedObjectType;

                    if (multiSign) {
                        signedObject = AccountLib.rawSigning.completeMultiSigned(transaction.Json, [
                            {
                                pubKey: publicKey,
                                signature: sig,
                            },
                        ]);
                    } else {
                        signedObject = AccountLib.rawSigning.complete(preparedTx, sig);
                    }

                    // include sign method
                    signedObject = { ...signedObject, signMethod: AuthMethods.TANGEM };

                    setTimeout(() => {
                        this.onSign(signedObject);
                    }, 2000);
                })
                .catch(this.dismiss)
                .finally(() => {
                    setTimeout(() => {
                        RNTangemSdk.stopSession().catch(() => {
                            // ignore
                        });
                    }, 10000);
                });
        } catch (e: any) {
            this.onSignError(AuthMethods.TANGEM, e);
        }
    };

    onSign = (signedObject: SignedObjectType) => {
        const { onSign } = this.props;

        if (typeof onSign === 'function') {
            onSign(signedObject);
        }

        this.close();
    };

    render() {
        const { signer } = this.state;

        if (!signer) return null;

        let Method = null;

        switch (signer.encryptionLevel) {
            case EncryptionLevels.Passcode:
                Method = PasscodeMethod;
                break;
            case EncryptionLevels.Passphrase:
                Method = PassphraseMethod;
                break;
            case EncryptionLevels.Physical:
                Method = TangemMethod;
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
                    dismiss: this.dismiss,
                }}
            >
                <Method />
            </MethodsContext.Provider>
        );
    }
}

/* Export Component ==================================================================== */
export default VaultModal;
