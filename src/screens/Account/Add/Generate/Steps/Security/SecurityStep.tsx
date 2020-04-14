/**
 * Generate Account/Security Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

// components
import { Button, RadioButton, Footer } from '@components';

// locale
import Localize from '@locale';

import { EncryptionLevels } from '@store/types';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

import { GenerateSteps, AccountObject } from '@screens/Account/Add/Generate/types';

/* types ==================================================================== */
export interface Props {
    account: AccountObject;
    goBack: (step?: GenerateSteps, settings?: AccountObject) => void;
    goNext: (step?: GenerateSteps, settings?: AccountObject) => void;
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
            <SafeAreaView testID="account-generate-finish-view" style={[AppStyles.pageContainerFull]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.chooseWisely')}
                </Text>
                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress('passcode');
                        }}
                        description={Localize.t('account.passcodeOptionDesc')}
                        labelSmall={Localize.t('account.singWithPasscode')}
                        label={Localize.t('global.standard')}
                        checked={security === 'passcode'}
                    />
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress('passphrase');
                        }}
                        description={Localize.t('account.passphraseOptionDesc')}
                        labelSmall={Localize.t('account.singWithPassphrase')}
                        label={Localize.t('global.extraSecurity')}
                        checked={security === 'passphrase'}
                    />
                </View>
                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
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
