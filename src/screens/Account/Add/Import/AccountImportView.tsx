/**
 * Import Account Screen
 */

import { dropRight, last, isEmpty, has, get } from 'lodash';
import React, { Component } from 'react';
import { View, Keyboard, Alert } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';
import { utils, XRPL_Account } from 'xrpl-accountlib';

import { PayloadOrigin } from '@common/libs/payload';
import { Toast } from '@common/helpers/interface';
import { getAccountName } from '@common/helpers/resolver';
import { Navigator } from '@common/helpers/navigator';

import { GetWalletDerivedPublicKey } from '@common/utils/tangem';
import { AppScreens } from '@common/constants';

import { LedgerService } from '@services';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';
import { AccessLevels, EncryptionLevels, AccountTypes } from '@store/types';

import { Header } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';

// steps
import Steps from './Steps';

// context
import { StepsContext } from './Context';

/* types ==================================================================== */
import { ImportSteps, SecretTypes, Props, State } from './types';

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
        const address = utils.deriveAddress(publicKey);

        // generate XRPL account
        const account = new XRPL_Account({ address, keypair: { publicKey, privateKey: undefined } });

        this.setState({
            importedAccount: account,
            account: {
                type: AccountTypes.Tangem,
                publicKey: account.keypair.publicKey,
                address: account.address,
                default: true,
                encryptionLevel: EncryptionLevels.Physical,
                accessLevel: AccessLevels.Full,
                accountType: AccountTypes.Tangem,
                additionalInfoString: JSON.stringify(tangemCard),
            },
        });
    };

    setEncryptionLevel = (encryptionLevel: EncryptionLevels, callback?: any) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, { encryptionLevel }) }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
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

    setSecretType = (type: SecretTypes, callback?: any) => {
        this.setState({ secretType: type }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
    };

    setImportedAccount = (importedAccount: XRPL_Account, callback?: any) => {
        const { account } = this.state;

        this.setState(
            {
                importedAccount,
                account: Object.assign(account, {
                    publicKey: importedAccount.keypair.publicKey,
                    address: importedAccount.address,
                    default: true,
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
                    Alert.alert(Localize.t('global.error'), Localize.t('account.accountAlreadyExist'));
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
        const { account, importedAccount, passphrase, alternativeSeedAlphabet } = this.state;

        try {
            let encryptionKey;
            let createdAccount = undefined as AccountSchema;

            if (account.accessLevel === AccessLevels.Full) {
                // if passphrase present use it, instead use Passcode to encrypt the private key
                // WARNING: passcode should use just for low balance accounts
                if (account.encryptionLevel === EncryptionLevels.Passphrase) {
                    encryptionKey = passphrase;
                } else {
                    encryptionKey = CoreRepository.getSettings().passcode;
                }
                // import account as full access
                createdAccount = await AccountRepository.add(
                    account,
                    importedAccount.keypair.privateKey,
                    encryptionKey,
                );
            } else {
                // import account as readonly
                createdAccount = await AccountRepository.add(account);
            }

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
                            origin: PayloadOrigin.IMPORT_ACCOUNT,
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
