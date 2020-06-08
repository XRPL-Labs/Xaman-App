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
import { GenerateSteps, State, Props } from './types';

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
            generatedAccount: undefined,
            passphrase: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.generateAccount();
        });
    }

    generateAccount = () => {
        setTimeout(() => {
            // generate new account base on secret numbers
            const generatedAccount = AccountLib.generate.secretNumbers();

            // assign generated account to the store object
            const account = {
                publicKey: generatedAccount.keypair.publicKey,
                accessLevel: AccessLevels.Full,
                address: generatedAccount.address,
                default: true,
            };

            this.setState({ generatedAccount, account });
        }, 300);
    };

    setEncryptionLevel = (encryptionLevel: EncryptionLevels) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, { encryptionLevel }) });
    };

    setLabel = (label: string) => {
        const { account } = this.state;
        this.setState({ account: Object.assign(account, { label }) });
    };

    setPassphrase = (passphrase: string) => {
        this.setState({ passphrase });
    };

    saveAccount = async () => {
        const { generatedAccount, account, passphrase } = this.state;

        let encryptionKey;

        // if passphrase present use it, instead use Passcode to encrypt the private key
        // WARNING: passcode should use just for low balance accounts
        if (account.encryptionLevel === EncryptionLevels.Passphrase) {
            encryptionKey = passphrase;
        } else {
            encryptionKey = CoreRepository.getSettings().passcode;
        }

        // add account to store
        AccountRepository.add(account, generatedAccount.keypair.privateKey, encryptionKey);
    };

    goNext = (nextStep: GenerateSteps) => {
        const { currentStep, prevSteps } = this.state;

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

    goBack = () => {
        const { prevSteps } = this.state;

        if (isEmpty(prevSteps)) {
            Navigator.pop();
        } else {
            this.setState({
                currentStep: last(prevSteps),
                prevSteps: dropRight(prevSteps),
            });
        }
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
