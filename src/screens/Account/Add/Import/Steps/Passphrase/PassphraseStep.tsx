/**
 * Import Account/Passphrase Step
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';

import Localize from '@locale';
// components
import { PasswordInput, Button, Footer, Header } from '@components/General';

// style
import { AppStyles } from '@theme';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    passphrase: {
        value: string;
        isValid: boolean;
    };
    passphrase_confirmation: string;
}

/* Component ==================================================================== */
class PassphraseStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            passphrase: {
                value: '',
                isValid: false,
            },
            passphrase_confirmation: '',
        };
    }

    goNext = () => {
        const { passphrase, passphrase_confirmation } = this.state;
        const { goNext, setPassphrase } = this.context;

        if (!passphrase.isValid) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.passwordShouldContain'));
            return;
        }

        if (passphrase.value !== passphrase_confirmation) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.passwordConfirmNotMatch'));
            return;
        }

        if (passphrase) {
            // set the passphrase
            setPassphrase(passphrase.value, () => {
                // go to the next step
                goNext('LabelStep');
            });
        } else {
            Alert.alert(Localize.t('global.error'), Localize.t('account.enterValidPassword'));
        }
    };

    onPassphraseChange = (value: string, isValid: boolean) => {
        this.setState({ passphrase: { value, isValid } });
    };

    onPassphraseConfirmChange = (passphrase_confirmation: string) => {
        this.setState({ passphrase_confirmation });
    };

    render() {
        const { goBack } = this.context;
        const { passphrase } = this.state;

        return (
            <SafeAreaView testID="account-import-passphrase-view" style={[AppStyles.container]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseEnterSafePassword')}
                </Text>

                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior="padding"
                    keyboardVerticalOffset={Header.Height}
                    style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}
                >
                    <PasswordInput
                        testID="passphrase-input"
                        editable
                        placeholder={Localize.t('account.enterPassword')}
                        minLength={8}
                        onChange={this.onPassphraseChange}
                        validate
                        autoFocus
                    />

                    <PasswordInput
                        testID="passphrase-confirm-input"
                        editable={passphrase.isValid}
                        placeholder={Localize.t('account.repeatPassword')}
                        selectTextOnFocus={passphrase.isValid}
                        onChange={this.onPassphraseConfirmChange}
                        validate={false}
                    />
                </KeyboardAvoidingView>
                <Footer style={[AppStyles.centerAligned, AppStyles.row]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            secondary
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            isDisabled={!passphrase.isValid}
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.next')}
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default PassphraseStep;
