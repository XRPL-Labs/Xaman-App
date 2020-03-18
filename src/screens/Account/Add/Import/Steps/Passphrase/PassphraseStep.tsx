/**
 * Generate Account/View Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { ImportSteps } from '@screens/Account/Add/Import';

import Localize from '@locale';
// components
import { Button, PasswordInput, Footer } from '@components';
// style
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {
    goBack: (step?: ImportSteps, settings?: any) => void;
    goNext: (step?: ImportSteps, settings?: any) => void;
}

export interface State {
    passphrase: {
        value: string;
        isValid: boolean;
    };
    passphrase_confirmation: string;
}

/* Component ==================================================================== */
class PassphraseStep extends Component<Props, State> {
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
        const { goNext } = this.props;

        if (!passphrase.isValid) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.passphraseShouldContain'));
            return;
        }

        if (passphrase.value !== passphrase_confirmation) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.passphraseConfirmNotMatch'));
            return;
        }

        if (passphrase) {
            goNext('LabelStep', { passphrase: passphrase.value });
        } else {
            Alert.alert(Localize.t('global.error'), Localize.t('account.enterValidPassphrase'));
        }
    };

    render() {
        const { goBack } = this.props;
        const { passphrase } = this.state;
        return (
            <SafeAreaView testID="account-import-set-passphrase" style={[AppStyles.container]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseEnterSafePassphrase')}
                </Text>

                <KeyboardAvoidingView
                    behavior="padding"
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 110 : 0}
                    style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.paddingSml]}
                >
                    <PasswordInput
                        editable
                        placeholder={Localize.t('account.enterPassphrase')}
                        minLength={8}
                        onChange={(value: string, isValid: boolean) => {
                            this.setState({ passphrase: { value, isValid } });
                        }}
                        validate
                        autoFocus
                    />

                    <PasswordInput
                        editable={passphrase.isValid}
                        placeholder={Localize.t('account.repeatPassphrase')}
                        selectTextOnFocus={passphrase.isValid}
                        onChange={passphrase_confirmation => this.setState({ passphrase_confirmation })}
                        validate={false}
                    />
                </KeyboardAvoidingView>
                <Footer style={[AppStyles.centerAligned, AppStyles.row]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            secondary
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={() => {
                                goBack();
                            }}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            isDisabled
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.next')}
                            onPress={() => {
                                this.goNext();
                            }}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default PassphraseStep;
