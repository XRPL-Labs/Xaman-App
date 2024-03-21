/**
 * Generate Account/Passphrase Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert } from 'react-native';

// components
import { PasswordInput, Button, Footer, KeyboardAwareScrollView } from '@components/General';

// locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    passphrase: {
        value: string;
        isValid: boolean;
    };
    passphraseConfirmation: string;
}

/* Component ==================================================================== */
class PassphraseStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            passphrase: {
                value: '',
                isValid: false,
            },
            passphraseConfirmation: '',
        };
    }

    goNext = () => {
        const { passphrase, passphraseConfirmation } = this.state;
        const { goNext, setPassphrase } = this.context;

        if (passphrase.value !== passphraseConfirmation) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.passwordConfirmNotMatch'));
            return;
        }

        if (passphrase) {
            // set the passphrase
            setPassphrase(passphrase.value, () => {
                // go to next step
                goNext('LabelStep');
            });
        } else {
            Alert.alert(Localize.t('global.error'), Localize.t('account.enterValidPassword'));
        }
    };

    onPassphraseChange = (value: string, isValid?: boolean) => {
        this.setState({ passphrase: { value, isValid: isValid! } });
    };

    onPassphraseConfirmChange = (passphraseConfirmation: string) => {
        this.setState({ passphraseConfirmation });
    };

    render() {
        const { goBack } = this.context;
        const { passphrase } = this.state;
        return (
            <SafeAreaView testID="account-generate-passphrase-view" style={AppStyles.container}>
                <KeyboardAwareScrollView
                    style={[AppStyles.flex1, AppStyles.stretchSelf, AppStyles.paddingHorizontal]}
                    contentContainerStyle={AppStyles.flex1}
                >
                    <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {Localize.t('account.pleaseEnterSafePassword')}
                    </Text>

                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
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
                            selectTextOnFocus={passphrase.isValid}
                            placeholder={Localize.t('account.repeatPassword')}
                            onChange={this.onPassphraseConfirmChange}
                            validate={false}
                        />
                    </View>
                </KeyboardAwareScrollView>

                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            light
                            onPress={goBack}
                        />
                    </View>
                    <View style={AppStyles.flex5}>
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
