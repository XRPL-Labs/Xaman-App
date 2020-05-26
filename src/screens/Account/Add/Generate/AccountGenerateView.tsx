/**
 * Generate Account Screen
 */

import { dropRight, last, isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Keyboard, InteractionManager } from 'react-native';

import * as AccountLib from 'xrpl-accountlib';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { EncryptionLevels, AccessLevels } from '@store/types';
import { Navigator } from '@common/helpers/navigator';

// constants
import { AppScreens } from '@common/constants';

import { Header } from '@components';

// localize
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

// steps
import Steps from './Steps';

import { GenerateSteps, AccountObject } from './types';
/* types ==================================================================== */

export interface Props {}

export interface State {
    currentStep: GenerateSteps;
    prevSteps: Array<GenerateSteps>;
    account: AccountObject;
}

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

        this.state = {
            currentStep: 'SeedExplanation',
            prevSteps: [],
            account: {},
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.generateAccount();
        });
    }

    generateAccount = () => {
        setTimeout(() => {
            const generatedAccount = AccountLib.generate.secretNumbers();
            this.setState({ account: { generatedAccount } });
        }, 300);
    };

    saveSettings = (accountObject: AccountObject) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, accountObject) });
    };

    saveAccount = async () => {
        const { account } = this.state;

        let encryptionKey;

        // if passphrase present use it, instead use Passcode to encrypt the private key
        // WARNING: passcode should use just for low balance accounts
        if (account.encryptionLevel === EncryptionLevels.Passphrase) {
            encryptionKey = account.passphrase;
        } else {
            encryptionKey = CoreRepository.getSettings().passcode;
        }

        // add account to store
        AccountRepository.add({
            account: account.generatedAccount,
            encryptionLevel: account.encryptionLevel,
            encryptionKey,
            accessLevel: AccessLevels.Full,
            label: account.label,
        });
    };

    goNext = (nextStep: GenerateSteps, settings?: AccountObject) => {
        const { currentStep, prevSteps } = this.state;

        if (settings) {
            this.saveSettings(settings);
        }

        if (currentStep === 'FinishStep') {
            this.saveAccount();
            Navigator.popToRoot();
        } else {
            prevSteps.push(currentStep);

            this.setState({
                currentStep: nextStep,
                prevSteps,
            });
        }
    };

    goBack = (nextStep: GenerateSteps, settings?: AccountObject) => {
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

    renderStep = () => {
        const { currentStep, account } = this.state;

        const Step = Steps[currentStep];

        // @ts-ignore
        return <Step account={account} goBack={this.goBack} goNext={this.goNext} />;
    };

    renderHeader = () => {
        const { currentStep } = this.state;

        if (currentStep === 'FinishStep') return null;

        let title = 'Header';

        switch (currentStep) {
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
                testID="account-generate-view"
                style={[AppStyles.flex1]}
            >
                {this.renderHeader()}
                {this.renderStep()}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AccountGenerateView;
