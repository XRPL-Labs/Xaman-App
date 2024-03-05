/**
 * Accounts Edit Change Passphrase
 */

import React, { Component } from 'react';
import { Alert, View, Keyboard } from 'react-native';

import { AppScreens } from '@common/constants';

import { Navigator } from '@common/helpers/navigator';
import Vault from '@common/libs/vault';

import { AccountModel } from '@store/models';

import { PasswordInput, Header, Footer, Button, Spacer, KeyboardAwareScrollView } from '@components/General';

import Localize from '@locale';

import { CriticalProcessingOverlayProps } from '@screens/Overlay/CriticalProcessing';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
}

export interface State {
    currentPassphrase: string;
    passphrase: {
        value: string;
        isValid: boolean;
    };
    passphrase_confirmation: string;
}

/* Component ==================================================================== */
class ChangePassphraseView extends Component<Props, State> {
    static screenName = AppScreens.Account.Edit.ChangePassphrase;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            currentPassphrase: '',
            passphrase: {
                value: '',
                isValid: false,
            },
            passphrase_confirmation: '',
        };
    }

    processChangePassphrase = (): Promise<boolean> => {
        const { account } = this.props;
        const { currentPassphrase, passphrase } = this.state;

        return new Promise((resolve, reject) => {
            // reKey the account with new passphrase
            Vault.reKey(account.publicKey, currentPassphrase, passphrase.value).then(resolve).catch(reject);
        });
    };

    onChangePassphraseSuccess = async () => {
        // close the screen
        await Navigator.pop();

        // show success message
        Alert.alert(Localize.t('global.success'), Localize.t('account.yourAccountPasswordChangedSuccessfully'));
    };

    onChangePassphraseError = () => {
        Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
    };

    onSavePress = async () => {
        const { account } = this.props;
        const { currentPassphrase, passphrase, passphrase_confirmation } = this.state;

        try {
            if (!currentPassphrase) {
                Alert.alert(Localize.t('global.error'), Localize.t('account.currentPasswordShouldNotBeEmpty'));
                return;
            }

            if (!passphrase.isValid) {
                Alert.alert(Localize.t('global.error'), Localize.t('account.enterValidPassword'));
                return;
            }

            if (passphrase.value !== passphrase_confirmation) {
                Alert.alert(Localize.t('global.error'), Localize.t('account.passwordConfirmNotMatch'));
                return;
            }

            // try to open vault with given passphrase
            const privateKey = await Vault.open(account.publicKey, currentPassphrase);

            if (!privateKey) {
                Alert.alert(Localize.t('global.error'), Localize.t('account.enteredCurrentPasswordIsInvalid'));
                return;
            }

            // show critical processing overlay
            Navigator.showOverlay<CriticalProcessingOverlayProps>(AppScreens.Overlay.CriticalProcessing, {
                title: Localize.t('global.encrypting'),
                task: this.processChangePassphrase,
                onSuccess: this.onChangePassphraseSuccess,
                onError: this.onChangePassphraseError,
            });
        } catch {
            Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
        }
    };

    onHeaderBackPress = () => {
        Navigator.pop();
    };

    onCurrentPassphraseChange = (currentPassphrase: string) => {
        this.setState({ currentPassphrase });
    };

    onPassphraseChange = (value: string, isValid?: boolean) => {
        this.setState({ passphrase: { value, isValid: isValid! } });
    };

    onPassphraseConfirmChange = (passphrase_confirmation: string) => {
        this.setState({ passphrase_confirmation });
    };

    // dismiss the keyboard when click outside
    shouldSetResponse = () => true;
    onRelease = () => Keyboard.dismiss();

    render() {
        const { passphrase } = this.state;

        return (
            <View
                onResponderRelease={this.onRelease}
                onStartShouldSetResponder={this.shouldSetResponse}
                testID="account-change-passphrase-view"
                style={[styles.container]}
            >
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.onHeaderBackPress,
                    }}
                    centerComponent={{ text: Localize.t('account.changePassword') }}
                />
                <KeyboardAwareScrollView style={[AppStyles.flex1]} contentContainerStyle={[AppStyles.paddingSml]}>
                    <PasswordInput
                        testID="current-passphrase-input"
                        placeholder={Localize.t('account.currentPassword')}
                        selectTextOnFocus={passphrase.isValid}
                        onChange={this.onCurrentPassphraseChange}
                        validate={false}
                    />

                    <Spacer />
                    <PasswordInput
                        testID="new-passphrase-input"
                        editable
                        placeholder={Localize.t('account.newPassword')}
                        minLength={8}
                        onChange={this.onPassphraseChange}
                        autoFocus={false}
                        validate
                    />

                    <PasswordInput
                        testID="new-confirm-passphrase-input"
                        editable={passphrase.isValid}
                        placeholder={Localize.t('account.repeatPassword')}
                        selectTextOnFocus={passphrase.isValid}
                        onChange={this.onPassphraseConfirmChange}
                        validate={false}
                    />
                </KeyboardAwareScrollView>
                <Footer safeArea>
                    <Button
                        numberOfLines={1}
                        testID="save-button"
                        label={Localize.t('global.save')}
                        onPress={this.onSavePress}
                    />
                </Footer>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ChangePassphraseView;
