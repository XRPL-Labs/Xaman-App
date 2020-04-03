/**
 * Import Account Screen
 */

import React, { Component } from 'react';
import { View, Keyboard, Alert } from 'react-native';
import { dropRight, last, isEmpty } from 'lodash';

import { XRPL_Account } from 'xrpl-accountlib';

import { AccountRepository } from '@store/repositories';
import { AccessLevels, EncryptionLevels } from '@store/types';
import { Navigator } from '@common/helpers';

// constants
import { AppScreens } from '@common/constants';

// components
import { Header } from '@components';

// localize
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

// steps
import Steps from './Steps';

/* types ==================================================================== */

export type ImportSteps = keyof typeof Steps;

export interface AccountObject {
    importedAccount?: XRPL_Account;
    passphrase?: string;
    accessLevel?: AccessLevels;
    encryptionLevel?: EncryptionLevels;
    accountType?: string;
    label?: string;
}

export interface Props {
    upgrade: boolean;
}

export interface State {
    currentStep: ImportSteps;
    prevSteps: Array<ImportSteps>;
    account: AccountObject;
}

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
            currentStep: props.upgrade ? 'AccountType' : 'AccessLevel',
            prevSteps: [],
            account: {},
        };
    }

    saveSettings = (accountObject: AccountObject) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, accountObject) });
    };

    goNext = (nextStep: ImportSteps, settings?: AccountObject) => {
        const { upgrade } = this.props;
        const { account, currentStep, prevSteps } = this.state;

        if (settings) {
            this.saveSettings(settings);
        }

        if (currentStep === 'FinishStep') {
            this.importAccount();
            Navigator.popToRoot();
        } else {
            // check if the account is already exist before
            // move to next step
            if ((nextStep === 'ConfirmPublicKey' || nextStep === 'LabelStep') && !upgrade) {
                if (!isEmpty(AccountRepository.findBy('address', account.importedAccount.address))) {
                    Alert.alert(Localize.t('global.error'), Localize.t('account.accountAlreadyExist'));
                    return;
                }
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

    goBack = (nextStep: ImportSteps, settings?: AccountObject) => {
        const { prevSteps } = this.state;

        if (settings) {
            this.saveSettings(settings);
        }

        if (isEmpty(prevSteps)) {
            Navigator.pop();
        } else {
            this.setState({
                currentStep: nextStep || last(prevSteps),
                prevSteps: dropRight(prevSteps),
            });
        }
    };

    importAccount = () => {
        const { account } = this.state;
        // add account to store
        AccountRepository.add({
            label: account.label,
            account: account.importedAccount,
            passphrase: account.encryptionLevel === EncryptionLevels.Passphrase ? account.passphrase : null,
            readonly: account.accessLevel === AccessLevels.Readonly,
        });
    };

    renderStep = () => {
        const { currentStep, account } = this.state;

        const Step = Steps[currentStep];

        return <Step goBack={this.goBack} goNext={this.goNext} account={account} />;
    };

    renderHeader = () => {
        const { currentStep } = this.state;

        if (currentStep === 'FinishStep') return null;

        let title = '';

        switch (currentStep) {
            case 'AccessLevel':
                title = Localize.t('account.accountType');
                break;
            case 'AccountType':
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
                style={AppStyles.pageContainerFull}
            >
                {this.renderHeader()}
                {this.renderStep()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountImportView;
