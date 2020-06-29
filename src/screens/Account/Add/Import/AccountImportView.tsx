/**
 * Import Account Screen
 */

import { dropRight, last, isEmpty, has, get } from 'lodash';

import React, { Component } from 'react';
import { View, Keyboard, Alert } from 'react-native';

import { XRPL_Account } from 'xrpl-accountlib';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccessLevels, EncryptionLevels } from '@store/types';

import { Navigator } from '@common/helpers/navigator';

import { LedgerService } from '@services';

// constants
import { AppScreens } from '@common/constants';

// components
import { Header } from '@components/General';

// localize
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

// steps
import Steps from './Steps';

// context
import { StepsContext } from './Context';

/* types ==================================================================== */
import { ImportSteps, Props, State } from './types';

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

        this.state = {
            currentStep: props.upgrade ? 'SecretType' : 'AccessLevel',
            prevSteps: [],
            account: {},
            importedAccount: undefined,
            passphrase: undefined,
            upgrade: props.upgrade,
        };
    }

    componentDidMount() {
        const { upgrade } = this.props;

        // set the access level if it's upgrade
        if (upgrade) {
            this.setAccessLevel(AccessLevels.Full);
        }
    }

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
        const { upgrade, importedAccount, currentStep, prevSteps } = this.state;

        if (currentStep === 'FinishStep') {
            this.importAccount();
            Navigator.popToRoot();
        } else {
            // if it's upgrade check if entered secret is match the account
            if (nextStep === 'ConfirmPublicKey' && upgrade) {
                if (importedAccount.address !== upgrade.address) {
                    Alert.alert(Localize.t('global.error'), Localize.t('account.upgradeAccountSecretIsNotMatch'));
                    return;
                }
            }

            // check if the account is already exist before move to next step
            // if it's exist and readonly move as upgrade
            if ((nextStep === 'ConfirmPublicKey' || nextStep === 'LabelStep') && !upgrade) {
                const exist = AccountRepository.findOne({ address: importedAccount.address });

                if (!isEmpty(exist)) {
                    if (exist.accessLevel === AccessLevels.Full) {
                        Alert.alert(Localize.t('global.error'), Localize.t('account.accountAlreadyExist'));
                        return;
                    }

                    // set as upgrade
                    this.setState({ upgrade: exist });
                }
            }

            // check if account is activated
            // if not  -> show the activation explain step
            if (currentStep === 'ConfirmPublicKey') {
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
                    });
            }

            prevSteps.push(currentStep);

            // ignore label if its in upgrade process
            if (nextStep === 'LabelStep' && upgrade) {
                this.setState({
                    currentStep: 'FinishStep',
                    prevSteps,
                });
            } else if (nextStep === 'ConfirmPublicKey' && upgrade) {
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
        }
    };

    goBack = () => {
        const { upgrade } = this.props;
        const { prevSteps, currentStep } = this.state;

        // clear upgrade if we manually added it on back
        if (currentStep === 'ConfirmPublicKey' && !upgrade) {
            this.setState({
                upgrade: undefined,
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

    importAccount = () => {
        const { account, importedAccount, passphrase } = this.state;

        let encryptionKey;

        if (account.accessLevel === AccessLevels.Full) {
            // if passphrase present use it, instead use Passcode to encrypt the private key
            // WARNING: passcode should use just for low balance accounts
            if (account.encryptionLevel === EncryptionLevels.Passphrase) {
                encryptionKey = passphrase;
            } else {
                encryptionKey = CoreRepository.getSettings().passcode;
            }
        }

        // add account to store
        AccountRepository.add(account, importedAccount.keypair.privateKey, encryptionKey);
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
                }}
            >
                <Step />
            </StepsContext.Provider>
        );
    };

    renderHeader = () => {
        const { currentStep } = this.state;

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
                title = Localize.t('account.familySeed');
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
                title = Localize.t('global.passphrase');
                break;
            case 'SecurityStep':
                title = Localize.t('account.extraSecurity');
                break;
            default:
                break;
        }

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
