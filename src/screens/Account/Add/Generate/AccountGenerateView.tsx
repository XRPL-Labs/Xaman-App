/**
 * Generate Account Screen
 */

import { dropRight, isEmpty, last } from 'lodash';

import React, { Component } from 'react';
import { InteractionManager, Keyboard, View } from 'react-native';

import * as AccountLib from 'xrpl-accountlib';

import { Toast } from '@common/helpers/interface';

import { SHA256 } from '@common/libs/crypto';

import { Navigator } from '@common/helpers/navigator';

import { AccountRepository, CoreRepository, ProfileRepository } from '@store/repositories';
import { AccountModel } from '@store/models';
import { AccessLevels, EncryptionLevels } from '@store/types';

import backendService from '@services/BackendService';

// constants
import { AppScreens } from '@common/constants';

import { Header } from '@components/General';

import Vault from '@common/libs/vault';

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
import { GenerateSteps, Props, State } from './types';

/* Component ==================================================================== */
class AccountGenerateView extends Component<Props, State> {
    static screenName = AppScreens.Account.Generate;

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

        const numAccounts = AccountRepository.count();
        const currentStep = props?.initial?.step
            ? props?.initial?.step
            : numAccounts === 0
            ? 'DegenMode'           // Only if new
            : 'SeedExplanation';    // Already has accounts, regular flow
        
        const existing = props?.initial?.secretNumbers
            ? this.existingAccount()
            : undefined;

        const generatedAccount = existing ? existing.generatedAccount : undefined;
        const account = existing ? existing.account : {};

        this.state = {
            currentStep,
            prevSteps: [],
            degenMode: !!props?.initial?.secretNumbers,
            account,
            generatedAccount,
            passphrase: undefined,
        };
    }

    componentDidMount() {
        const { initial } = this.props;
        InteractionManager.runAfterInteractions(() => {
            if (!initial?.secretNumbers) {
                requestAnimationFrame(this.generateAccount);
            }
        });
    }

    existingAccount = () => {
        const { initial } = this.props;

        // generate new account base on secret numbers
        const generatedAccount = AccountLib.derive.secretNumbers(initial?.secretNumbers!);

        // assign generated account to the store object
        const account = {
            publicKey: generatedAccount.keypair.publicKey,
            accessLevel: AccessLevels.Full,
            encryptionVersion: Vault.getLatestCipherVersion(),
            address: generatedAccount.address,
        } as Partial<AccountModel>;

        return { generatedAccount, account };
    };

    generateAccount = () => {
        // generate new account base on secret numbers
        const generatedAccount = AccountLib.generate.secretNumbers();

        // assign generated account to the store object
        const account = {
            publicKey: generatedAccount.keypair.publicKey,
            accessLevel: AccessLevels.Full,
            encryptionVersion: Vault.getLatestCipherVersion(),
            address: generatedAccount.address,
        } as Partial<AccountModel>;

        this.setState({ generatedAccount, account });
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

    saveAccount = async () => {
        const { generatedAccount, account, passphrase, degenMode } = this.state;

        try {
            // include user & device UUID is signed transaction
            const { deviceUUID, uuid } = ProfileRepository.getProfile()!;
            const { signedTransaction } = AccountLib.sign(
                { Account: account.address, InvoiceID: await SHA256(`${uuid}.${deviceUUID}.${account.address}`) },
                generatedAccount,
            );

            backendService.addAccount(account.address!, signedTransaction).catch(() => {
                setTimeout(() => {
                    backendService.privateAccountInfo(account?.address, account?.label, true);
                }, 2000);
            });

            let encryptionKey;
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

            if (degenMode) {
                Object.assign(account, {
                    additionalInfoString: JSON.stringify({
                        degenMode: generatedAccount?.secret?.secretNumbers?.join('.'),
                    }),
                });
            }

            // add account to store
            const createdAccount = await AccountRepository.add(
                account,
                generatedAccount?.keypair.privateKey!,
                encryptionKey,
            );

            // set the newly created account as default account
            CoreRepository.saveSettings({
                account: createdAccount,
            });

            // close the screen
            await Navigator.popToRoot();
        } catch {
            // this should never happen but in case just show error that something went wrong
            Toast(Localize.t('global.unexpectedErrorOccurred'));
        }
    };


    goNext = async (nextStep?: GenerateSteps) => {
        const { currentStep, prevSteps, degenMode, account } = this.state;

        if (currentStep === 'FinishStep') {
            await this.saveAccount();
            return;
        }

        if (currentStep === 'DegenMode' && degenMode) {
            // Done degen 
            await this.saveAccount();
            return;
        }

        if (currentStep === 'ConfirmSeed' && degenMode) {
            // Done confirming
            Object.assign(account, {
                additionalInfoString: JSON.stringify({}),
            });
            Navigator.showAlertModal({
                type: 'success',
                text: Localize.t('account.degenModeNowDone'),
                buttons: [
                    {
                        text: Localize.t('global.ok'),
                        type: 'dismiss',
                        light: false,
                    },
                ],
            });
            await AccountRepository.update(account);
            await Navigator.popToRoot();
            return;
        }

        prevSteps.push(currentStep);

        this.setState({
            currentStep: nextStep!,
            prevSteps,
        });
    };

    goBack = () => {
        const { prevSteps } = this.state;

        if (isEmpty(prevSteps)) {
            Navigator.pop();
        } else {
            this.setState({
                currentStep: last(prevSteps)!,
                prevSteps: dropRight(prevSteps),
            });
        }
    };

    onHeaderBackPress = () => {
        Navigator.pop();
    };

    setDegenMode = (degenMode: boolean, callback?: any) => {
        this.setState({ degenMode }, () => {
            if (typeof callback === 'function') {
                callback();
            }
        });
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
                    setEncryptionLevel: this.setEncryptionLevel,
                    setLabel: this.setLabel,
                    setDegenMode: this.setDegenMode,
                    setPassphrase: this.setPassphrase,
                }}
            >
                <Step />
            </StepsContext.Provider>
        );
    };

    renderHeader = () => {
        const { currentStep } = this.state;

        if (currentStep === 'FinishStep') return null;

        let title = 'Header';

        switch (currentStep) {
            case 'DegenMode':
                title = Localize.t('account.newAccountSafeOrDegenTitle');
                break;
            case 'SeedExplanation':
                title = Localize.t('global.important');
                break;
            case 'ViewPrivateKey':
                title = Localize.t('account.secretNumbers');
                break;
            case 'ConfirmSeed':
                title = Localize.t('global.confirm');
                break;
            case 'ViewPublicKey':
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
                    currentStep === 'SeedExplanation' || currentStep === 'DegenMode'
                        ? {
                              icon: 'IconChevronLeft',
                              onPress: this.onHeaderBackPress,
                          }
                        : {}
                }
                centerComponent={{ text: title }}
            />
        );
    };

    render() {
        return (
            <View
                onResponderRelease={Keyboard.dismiss}
                onStartShouldSetResponder={() => true}
                testID="account-generate-view"
                style={AppStyles.flex1}
            >
                {this.renderHeader()}
                {this.renderStep()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountGenerateView;
