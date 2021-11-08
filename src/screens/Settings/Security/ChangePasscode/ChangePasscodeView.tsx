/**
 * Change Passcode Screen
 */

import React, { Component } from 'react';
import { Results } from 'realm';
import { View, Text, Alert, InteractionManager } from 'react-native';

import { CoreRepository, AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';
import { EncryptionLevels } from '@store/types';

import Vault from '@common/libs/vault';
import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';

import { AuthenticationService } from '@services';

import { AppScreens } from '@common/constants';

import { Header, PinInput } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
enum Steps {
    ENTER_OLD_PASSCODE = 'ENTER_OLD_PASSCODE',
    ENTER_NEW_PASSCODE = 'ENTER_NEW_PASSCODE',
    CONFIRM_NEW_PASSCODE = 'CONFIRM_NEW_PASSCODE',
}

interface Props {}

interface State {
    newPasscode: string;
    currentStep: Steps;
    stepDescription: string;
}
/* Component ==================================================================== */
class ChangePasscodeView extends Component<Props, State> {
    static screenName = AppScreens.Settings.ChangePasscode;
    pinInput: PinInput;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            newPasscode: '',
            currentStep: Steps.ENTER_OLD_PASSCODE,
            stepDescription: Localize.t('settings.enterOldPasscode'),
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.focusPinInput);
    }

    focusPinInput = () => {
        setTimeout(() => {
            if (this.pinInput) {
                this.pinInput.focus();
            }
        }, 100);
    };

    changeStep = (step: Steps) => {
        let stepDescription;
        switch (step) {
            case Steps.ENTER_OLD_PASSCODE:
                stepDescription = Localize.t('settings.enterOldPasscode');
                break;
            case Steps.ENTER_NEW_PASSCODE:
                stepDescription = Localize.t('settings.enterNewPasscode');
                break;
            case Steps.CONFIRM_NEW_PASSCODE:
                stepDescription = Localize.t('settings.enterNewPasscodeAgain');
                break;
            default:
                break;
        }

        this.setState(
            {
                currentStep: step,
                stepDescription,
            },
            () => {
                this.pinInput.clean();
                this.focusPinInput();
            },
        );
    };

    changePasscode = () => {
        const { newPasscode } = this.state;

        const { passcode } = CoreRepository.getSettings();

        // store the new passcode in the store
        CoreRepository.setPasscode(newPasscode).then(async (newEncPasscode) => {
            if (!newEncPasscode) {
                Alert.alert(Localize.t('global.error'), Localize.t('setupPasscode.UnableToStoreThePasscode'));
                return;
            }
            // reKey all accounts with new passcode
            const accounts = AccountRepository.findBy(
                'encryptionLevel',
                EncryptionLevels.Passcode,
            ) as Results<AccountSchema>;

            for (const account of accounts) {
                await Vault.reKey(account.publicKey, passcode, newEncPasscode);
            }

            // everything went well
            Navigator.pop();
            Alert.alert(Localize.t('global.success'), Localize.t('settings.passcodeChangedSuccess'));
        });
    };

    checkOldPasscode = (oldPasscode: string) => {
        AuthenticationService.checkPasscode(oldPasscode)
            .then(() => {
                this.changeStep(Steps.ENTER_NEW_PASSCODE);
            })
            .catch((e) => {
                this.pinInput.clean();
                Alert.alert(Localize.t('global.error'), e.toString(), [{ text: 'OK', onPress: this.focusPinInput }], {
                    cancelable: false,
                });
            });
    };

    checkNewPasscode = (newPasscode: string, isStrong: boolean) => {
        if (isStrong) {
            this.setState({
                newPasscode,
            });
            this.changeStep(Steps.CONFIRM_NEW_PASSCODE);
        } else {
            Prompt(
                Localize.t('setupPasscode.weakPasscode'),
                Localize.t('setupPasscode.weakPasscodeDescription'),
                [
                    {
                        text: Localize.t('setupPasscode.useAnyway'),
                        onPress: () => {
                            this.setState({
                                newPasscode,
                            });
                            this.changeStep(Steps.CONFIRM_NEW_PASSCODE);
                        },
                        style: 'destructive',
                    },
                    {
                        text: Localize.t('setupPasscode.changePasscode'),
                        onPress: () => {
                            this.pinInput.clean();
                            this.focusPinInput();
                        },
                    },
                ],
                { type: 'default' },
            );
        }
    };

    checkConfirmPasscode = (newPasscodeConfirm: string) => {
        const { newPasscode } = this.state;

        if (newPasscode !== newPasscodeConfirm) {
            this.setState({ currentStep: Steps.ENTER_NEW_PASSCODE });
            this.pinInput.clean();
            Alert.alert(
                Localize.t('global.error'),
                Localize.t('settings.newOldPasscodeNotMatch'),
                [{ text: 'OK', onPress: this.focusPinInput }],
                { cancelable: false },
            );
        } else {
            this.changePasscode();
        }
    };

    onPasscodeEntered = (passcode: string, isStrong?: boolean) => {
        const { currentStep } = this.state;

        switch (currentStep) {
            case Steps.ENTER_OLD_PASSCODE:
                this.checkOldPasscode(passcode);
                break;
            case Steps.ENTER_NEW_PASSCODE:
                this.checkNewPasscode(passcode, isStrong);
                break;
            case Steps.CONFIRM_NEW_PASSCODE:
                this.checkConfirmPasscode(passcode);
                break;
            default:
                break;
        }
    };

    render() {
        const { currentStep, stepDescription } = this.state;

        return (
            <View testID="change-passcode-screen" style={[styles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('settings.changePasscode') }}
                />
                <View style={[AppStyles.flex3, AppStyles.flexEnd]}>
                    <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>{stepDescription}</Text>
                </View>
                <View style={[AppStyles.flex8, AppStyles.paddingSml, AppStyles.centerAligned]}>
                    <PinInput
                        ref={(r) => {
                            this.pinInput = r;
                        }}
                        autoFocus={false}
                        codeLength={6}
                        checkStrength={currentStep === Steps.ENTER_NEW_PASSCODE}
                        onFinish={this.onPasscodeEntered}
                    />
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ChangePasscodeView;
