/**
 * Change Passcode Screen
 */

import React, { Component } from 'react';
import { Results } from 'realm';
import { View, Text, Alert } from 'react-native';

import { CoreRepository, AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';
import { EncryptionLevels } from '@store/types';

import Vault from '@common/libs/vault';
import { Navigator } from '@common/helpers/navigator';

import { AuthenticationService } from '@services';

import { AppScreens } from '@common/constants';

import { Header, PinInput } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    newPasscode: string;
    step: 'current' | 'new' | 'confirm';
    description: string;
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
            step: 'current',
            description: Localize.t('settings.enterOldPasscode'),
        };
    }

    componentDidMount() {
        this.focusPinInput();
    }

    focusPinInput = () => {
        setTimeout(() => {
            if (this.pinInput) {
                this.pinInput.focus();
            }
        }, 100);
    };

    onFinish = () => {
        Navigator.pop();
        Alert.alert(Localize.t('global.success'), Localize.t('settings.passcodeChangedSuccess'));
    };

    changePasscode = () => {
        const { newPasscode } = this.state;

        const { passcode } = CoreRepository.getSettings();

        // store the new passcode in the store
        CoreRepository.setPasscode(newPasscode).then(async (newEncPasscode) => {
            // reKey all accounts with new passcode
            const accounts = AccountRepository.findBy('encryptionLevel', EncryptionLevels.Passcode) as Results<
                AccountSchema
            >;

            for (const account of accounts) {
                await Vault.reKey(account.publicKey, passcode, newEncPasscode);
            }

            // everything went well
            this.onFinish();
        });
    };

    onPasscodeEntered = (passcode: string) => {
        const { step, newPasscode } = this.state;

        switch (step) {
            case 'current':
                AuthenticationService.checkPasscode(passcode)
                    .then(() => {
                        this.setState({ step: 'new', description: Localize.t('settings.enterNewPasscode') });
                        this.pinInput.clean();
                        this.focusPinInput();
                    })
                    .catch((e) => {
                        this.pinInput.clean();
                        Alert.alert(
                            Localize.t('global.error'),
                            e.toString(),
                            [{ text: 'OK', onPress: this.focusPinInput }],
                            { cancelable: false },
                        );
                    });
                break;
            case 'new':
                this.setState({
                    newPasscode: passcode,
                    step: 'confirm',
                    description: Localize.t('settings.enterNewPasscodeAgain'),
                });
                this.pinInput.clean();
                this.focusPinInput();
                break;
            case 'confirm':
                if (newPasscode !== passcode) {
                    this.setState({ step: 'new' });
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
                break;
            default:
                break;
        }
    };

    render() {
        const { description } = this.state;

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
                    <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>{description}</Text>
                </View>
                <View style={[AppStyles.flex8, AppStyles.paddingSml, AppStyles.centerAligned]}>
                    <PinInput
                        ref={(r) => {
                            this.pinInput = r;
                        }}
                        autoFocus={false}
                        codeLength={6}
                        onFinish={this.onPasscodeEntered}
                    />
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ChangePasscodeView;
