/**
 * Generate Account/View Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { ImportSteps } from '@screens/Account/Add/Import';

import { EncryptionLevels } from '@store/types';

import Localize from '@locale';
// components
import { Button, RadioButton, Footer } from '@components';
// style
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {
    goBack: (step?: ImportSteps, settings?: any) => void;
    goNext: (step?: ImportSteps, settings?: any) => void;
}

export interface State {
    security: string;
}

/* Component ==================================================================== */
class SecurityStep extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            security: 'passcode',
        };
    }

    onRadioButtonPress = (option: string) => {
        this.setState({
            security: option,
        });
    };

    goNext = () => {
        const { goNext } = this.props;
        const { security } = this.state;
        if (security === 'passphrase') {
            goNext('PassphraseStep', { encryptionLevel: EncryptionLevels.Passphrase });
        } else {
            goNext('LabelStep', { encryptionLevel: EncryptionLevels.Passcode });
        }
    };

    render() {
        const { goBack } = this.props;
        const { security } = this.state;
        return (
            <SafeAreaView testID="account-import-security" style={[AppStyles.container]}>
                <Text style={[AppStyles.p, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.chooseWisely')}
                </Text>
                <View style={[AppStyles.contentContainer, AppStyles.flexStart, AppStyles.paddingSml]}>
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress('passcode');
                        }}
                        description={Localize.t('account.passcodeOptionDesc')}
                        labelSmall={Localize.t('account.signWithPasscode')}
                        label={Localize.t('global.standard')}
                        checked={security === 'passcode'}
                    />

                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress('passphrase');
                        }}
                        description={Localize.t('account.passphraseOptionDesc')}
                        labelSmall={Localize.t('account.signWithPassphrase')}
                        label={Localize.t('global.extraSecurity')}
                        checked={security === 'passphrase'}
                    />
                </View>

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
export default SecurityStep;
