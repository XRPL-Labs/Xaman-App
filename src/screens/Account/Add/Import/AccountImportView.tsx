/**
 * Import Account Screen
 */

import { dropRight, get, has, isEmpty, last } from 'lodash';
import React, { Component } from 'react';
import { Alert, Keyboard, View } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import * as AccountLib from 'xrpl-accountlib';

import { XAppOrigin } from '@common/libs/payload';
import { Toast } from '@common/helpers/interface';
import { getAccountName } from '@common/helpers/resolver';
import { Navigator } from '@common/helpers/navigator';

import { SHA256 } from '@common/libs/crypto';

import Vault from '@common/libs/vault';

import { GetCardId, GetWalletDerivedPublicKey } from '@common/utils/tangem';
import { AppScreens } from '@common/constants';

import backendService from '@services/BackendService';
import LedgerService from '@services/LedgerService';

import { AccountRepository, CoreRepository, ProfileRepository } from '@store/repositories';
import { AccountModel } from '@store/models';
import { AccessLevels, AccountTypes, EncryptionLevels } from '@store/types';

import { Header } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';

// steps
import Steps from './Steps';

// context
import { StepsContext } from './Context';

/* types ==================================================================== */
import { ImportSteps, Props, SecretTypes, State } from './types';

/* Component ==================================================================== */
class AccountImportView extends Component<Props, State> {
    static screenName = AppScreens.Account.Import;

    static options() {
        return {
            topBar: {
                visible: false,
            },
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        let initStep = undefined as ImportSteps;

        switch (true) {
            case props.upgradeAccount !== undefined:
                initStep = 'SecretType';
                break;
            case props.tangemCard !== undefined:
                initStep = 'VerifySignature';
                break;
            case props.alternativeSeedAlphabet !== undefined:
                initStep = 'EnterSeed';
                break;
            case props.importOfflineSecretNumber !== undefined:
                initStep = 'EnterSecretNumbers';
                break;
            default:
                initStep = 'AccessLevel';
                break;
        }

        this.state = {
            currentStep: initStep,
            prevSteps: [],
            account: {
                type: AccountTypes.Regular,
            },
            importedAccount: undefined,
            passphrase: undefined,
            tangemSignature: undefined,
            secretType: SecretTypes.SecretNumbers,
            upgradeAccount: props.upgradeAccount,
            alternativeSeedAlphabet: props.alternativeSeedAlphabet,
            importOfflineSecretNumber: props.importOfflineSecretNumber,
            isLoading: false,
        };
    }

    componentDidMount() {
        const { tangemCard } = this.props;
        const { upgradeAccount, alternativeSeedAlphabet, importOfflineSecretNumber } = this.state;

        // set the access level if it's upgrade or using alternative seed alphabet
        // as we just move to importing seed section setting this is mandatory
        if (upgradeAccount || alternativeSeedAlphabet || importOfflineSecretNumber) {
            this.setAccessLevel(AccessLevels.Full);
        }

        // populate tangem account details
        if (tangemCard) {
            this.populateTangemCard();
        }
    }

    populateTangemCard = () => {
        const { tangemCard } = this.props;

        // get derived public key from card data
        const publicKey = GetWalletDerivedPublicKey(tangemCard);

        // derive XRPL address from normalized public key
        const address = AccountLib.utils.deriveAddress(publicKey);

        // generate XRPL account
        const account = new AccountLib.XRPL_Account({ address, keypair: { publicKey, privateKey: undefined } });

        this.setState({
            importedAccount: account,
            account: {
                type: AccountTypes.Tangem,
                publicKey: account.keypair.publicKey,
                address: account.address,
                encryptionLevel: EncryptionLevels.Physical,
                accessLevel: AccessLevels.Full,
                additionalInfoString: JSON.stringify(tangemCard),
            },
        });
    };

    setEncryptionLevel = (encryptionLevel: EncryptionLevels, callback?: any) => {
        const { account } = this.state;
        this.setState(
            {
                account: Object.assign(account, {
                    encryptionLevel,
                    encryptionVersion:
                        encryptionLevel === EncryptionLevels.None ? undefined : Vault.getLatestCipherVersion(),
                }),
            },
            () => {
                if (typeof callback === 'function') {
                    callback();
                }
            },
        );
    };

    setLabel = (label: string, callback?: any) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, { label }) }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    setPassphrase = (passphrase: string, callback?: any) => {
        this.setState({ passphrase }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    setAccessLevel = (accessLevel: AccessLevels, callback?: any) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, { accessLevel }) }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    setAccountType = (type: AccountTypes, callback?: any) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, { type }) }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    setAdditionalInfo = (info: Object, callback?: any) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, { additionalInfoString: JSON.stringify(info) }) }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    setTangemSignature = (signature: string, callback?: any) => {
        this.setState({ tangemSignature: signature }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    setSecretType = (type: SecretTypes, callback?: any) => {
        this.setState({ secretType: type }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    setImportedAccount = (importedAccount: AccountLib.XRPL_Account, callback?: any) => {
        const { account } = this.state;

        this.setState(
            {
                importedAccount,
                account: Object.assign(account, {
                    publicKey: importedAccount.keypair.publicKey,
                    address: importedAccount.address,
                }),
            },
            () => {
                if (typeof callback === 'function') {
                    callback();
                }
            },
        );
    };

    goNext = async (nextStep: ImportSteps) => {
        const { account, upgradeAccount, importedAccount, alternativeSeedAlphabet, currentStep, prevSteps } =
            this.state;

        // we are in the last screen, just import the account and close the screen
        if (currentStep === 'FinishStep') {
            this.importAccount();
            return;
        }

        // if it's upgrade check if entered secret is match the account
        if (nextStep === 'ConfirmPublicKey' && upgradeAccount) {
            if (importedAccount.address !== upgradeAccount.address) {
                Alert.alert(Localize.t('global.error'), Localize.t('account.upgradeAccountSecretIsNotMatch'));
                return;
            }
        }

        // check if the account is already exist before move to next step
        // if it's exist and readonly move as upgrade
        if ((nextStep === 'ConfirmPublicKey' || nextStep === 'LabelStep') && !upgradeAccount) {
            const exist = AccountRepository.findOne({ address: importedAccount.address });

            if (exist) {
                if (
                    exist.accessLevel === AccessLevels.Full ||
                    account.accessLevel === AccessLevels.Readonly ||
                    account.type === AccountTypes.Tangem
                ) {
                    // alert the r address in case of importing full access
                    if (account.accessLevel === AccessLevels.Full && account.type === AccountTypes.Regular) {
                        Alert.alert(
                            Localize.t('global.error'),
                            Localize.t('account.importingSecretAccountExist', { address: importedAccount.address }),
                        );
                        return;
                    }

                    Alert.alert(
                        Localize.t('global.error'),
                        Localize.t('account.accountAlreadyExist', { address: importedAccount.address }),
                    );
                    return;
                }

                // set as upgrade
                this.setState({ upgradeAccount: exist });
            }
        }

        // check if account is activated
        // if not  -> show the activation explain step
        // skip this step when account imported with alternative alphabet
        if (currentStep === 'ConfirmPublicKey' && !alternativeSeedAlphabet) {
            this.setState({
                isLoading: true,
            });

            await LedgerService.getAccountInfo(importedAccount.address)
                .then((accountInfo: any) => {
                    if (!accountInfo || has(accountInfo, 'error')) {
                        if (get(accountInfo, 'error') === 'actNotFound') {
                            // account not activated
                            // override next step
                            nextStep = 'ExplainActivation';
                        }
                    }
                })
                .catch(() => {
                    // ignore
                })
                .finally(() => {
                    this.setState({
                        isLoading: false,
                    });
                });
        }

        prevSteps.push(currentStep);

        // ignore label if its in upgrade process
        if (nextStep === 'LabelStep' && upgradeAccount) {
            this.setState({
                currentStep: 'FinishStep',
                prevSteps,
            });
        } else if (nextStep === 'ConfirmPublicKey' && upgradeAccount) {
            this.setState({
                currentStep: 'SecurityStep',
                prevSteps,
            });
        } else {
            this.setState({
                currentStep: nextStep,
                prevSteps,
            });
        }
    };

    goBack = () => {
        const { upgradeAccount, prevSteps, currentStep } = this.state;

        // clear upgrade if we manually added it on back
        if (currentStep === 'ConfirmPublicKey' && !upgradeAccount) {
            this.setState({
                upgradeAccount: undefined,
            });
        }

        if (isEmpty(prevSteps)) {
            Navigator.pop();
        } else {
            this.setState({
                currentStep: last(prevSteps),
                prevSteps: dropRight(prevSteps),
            });
        }
    };

    importAccount = async () => {
        const { tangemCard } = this.props;
        const { account, importedAccount, passphrase, alternativeSeedAlphabet, tangemSignature } = this.state;

        try {
            let encryptionKey;
            let createdAccount = undefined as AccountModel;

            // if account is imported as full access report to the backend for security checks
            if (account.accessLevel === AccessLevels.Full) {
                // get the signature and add account
                if (account.type === AccountTypes.Tangem) {
                    backendService.addAccount(account.address, tangemSignature, GetCardId(tangemCard)).catch(() => {
                        // ignore
                    });
                } else {
                    // include device UUID is signed transaction
                    const { deviceUUID, uuid } = ProfileRepository.getProfile();
                    const { signedTransaction } = AccountLib.sign(
                        {
                            Account: account.address,
                            InvoiceID: await SHA256(`${uuid}.${deviceUUID}.${account.address}`),
                        },
                        importedAccount,
                    );

                    backendService.addAccount(account.address, signedTransaction).catch(() => {
                        // ignore
                    });
                }
            }

            // import account as full access
            if (account.accessLevel === AccessLevels.Full && account.type === AccountTypes.Regular) {
                // if passphrase present use it, instead use Passcode to encrypt the private key
                // WARNING: passcode should use just for low balance accounts
                if (account.encryptionLevel === EncryptionLevels.Passphrase) {
                    // check if passphrase is defined
                    if (!passphrase) {
                        throw new Error('Account encryption level set to passphrase but passphrase is undefined!');
                    }
                    encryptionKey = passphrase;
                } else if (account.encryptionLevel === EncryptionLevels.Passcode) {
                    encryptionKey = CoreRepository.getSettings().passcode;
                } else {
                    throw new Error('Account encryption level is not defined');
                }

                // import account as full access
                createdAccount = await AccountRepository.add(
                    account,
                    importedAccount.keypair.privateKey,
                    encryptionKey,
                );
            } else {
                // import account as readonly or tangem card
                createdAccount = await AccountRepository.add(account);
            }

            // set the newly created account as default account
            CoreRepository.saveSettings({
                account: createdAccount,
            });

            // update catch for this account
            getAccountName.cache.set(
                account.address,
                new Promise((resolve) => {
                    resolve({ name: account.label, source: 'accounts' });
                }),
            );

            // close the screen
            Navigator.popToRoot().then(() => {
                // if account imported with alternative seed alphabet and xApp present
                // route user to the xApp
                if (has(alternativeSeedAlphabet, 'params.xapp')) {
                    const xappIdentifier = get(alternativeSeedAlphabet, 'params.xapp');

                    Navigator.showModal(
                        AppScreens.Modal.XAppBrowser,
                        {
                            account: createdAccount,
                            identifier: xappIdentifier,
                            origin: XAppOrigin.IMPORT_ACCOUNT,
                            originData: alternativeSeedAlphabet,
                        },
                        {
                            modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                            modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                        },
                    );
                }
            });
        } catch {
            // this should never happen but in case just show error that something went wrong
            Toast(Localize.t('global.unexpectedErrorOccurred'));
        }
    };

    onHeaderBackPress = () => {
        Navigator.pop();
    };

    renderStep = () => {
        const { currentStep } = this.state;

        const Step = Steps[currentStep];

        return (
            <StepsContext.Provider
                value={{
                    ...this.state,
                    goNext: this.goNext,
                    goBack: this.goBack,

                    setAccessLevel: this.setAccessLevel,
                    setEncryptionLevel: this.setEncryptionLevel,
                    setLabel: this.setLabel,
                    setPassphrase: this.setPassphrase,
                    setImportedAccount: this.setImportedAccount,
                    setAccountType: this.setAccountType,
                    setAdditionalInfo: this.setAdditionalInfo,
                    setTangemSignature: this.setTangemSignature,
                    setSecretType: this.setSecretType,
                }}
            >
                <Step />
            </StepsContext.Provider>
        );
    };

    renderHeader = () => {
        const { currentStep, alternativeSeedAlphabet } = this.state;

        if (currentStep === 'FinishStep') return null;

        let title = '';

        switch (currentStep) {
            case 'AccessLevel':
                title = Localize.t('account.accountType');
                break;
            case 'SecretType':
                title = Localize.t('account.secretType');
                break;
            case 'EnterAddress':
                title = Localize.t('global.address');
                break;
            case 'EnterMnemonic':
            case 'MnemonicAlert':
                title = Localize.t('account.mnemonic');
                break;
            case 'EnterSecretNumbers':
                title = Localize.t('account.secretNumbers');
                break;
            case 'EnterSeed':
                if (alternativeSeedAlphabet) {
                    title = Localize.t('account.importSecret');
                } else {
                    title = Localize.t('account.familySeed');
                }
                break;
            case 'VerifySignature':
                title = Localize.t('account.verifyTangemCard');
                break;
            case 'ConfirmPublicKey':
                title = Localize.t('account.publicAddress');
                break;
            case 'ExplainActivation':
                title = Localize.t('global.activation');
                break;
            case 'LabelStep':
                title = Localize.t('account.accountLabel');
                break;
            case 'PassphraseStep':
                title = Localize.t('global.password');
                break;
            case 'SecurityStep':
                title = Localize.t('account.extraSecurity');
                break;
            default:
                break;
        }

        return (
            <Header
                leftComponent={
                    currentStep === 'AccessLevel' && {
                        icon: 'IconChevronLeft',
                        onPress: this.onHeaderBackPress,
                    }
                }
                centerComponent={{ text: title }}
            />
        );
    };

    render() {
        return (
            <View
                onResponderRelease={() => Keyboard.dismiss()}
                onStartShouldSetResponder={() => true}
                testID="account-import-view"
                style={AppStyles.container}
            >
                {this.renderHeader()}
                {this.renderStep()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountImportView;
