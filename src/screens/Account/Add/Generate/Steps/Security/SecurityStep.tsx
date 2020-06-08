/**
 * Generate Account/Security Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

// components
import { Button, RadioButton, Footer } from '@components/General';

// locale
import Localize from '@locale';

import { EncryptionLevels } from '@store/types';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

import { StepsContext } from '../../Context';
/* types ==================================================================== */
export interface Props {}

export interface State {
    encryptionLevel: EncryptionLevels;
}

/* Component ==================================================================== */
class SecurityStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            encryptionLevel: EncryptionLevels.Passcode,
        };
    }

    onRadioButtonPress = (option: EncryptionLevels) => {
        this.setState({
            encryptionLevel: option,
        });
    };

    goNext = () => {
        const { goNext, setEncryptionLevel } = this.context;
        const { encryptionLevel } = this.state;

        // set the encryption key
        setEncryptionLevel(encryptionLevel);

        if (encryptionLevel === EncryptionLevels.Passphrase) {
            goNext('PassphraseStep');
        } else {
            goNext('LabelStep');
        }
    };
    render() {
        const { goBack } = this.context;
        const { encryptionLevel } = this.state;

        return (
            <SafeAreaView testID="account-generate-finish-view" style={[AppStyles.container]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.chooseWisely')}
                </Text>
                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress(EncryptionLevels.Passcode);
                        }}
                        description={Localize.t('account.passcodeOptionDesc')}
                        labelSmall={Localize.t('account.signWithPasscode')}
                        label={Localize.t('global.standard')}
                        checked={encryptionLevel === EncryptionLevels.Passcode}
                    />
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress(EncryptionLevels.Passphrase);
                        }}
                        description={Localize.t('account.passphraseOptionDesc')}
                        labelSmall={Localize.t('account.signWithPassphrase')}
                        label={Localize.t('global.extraSecurity')}
                        checked={encryptionLevel === EncryptionLevels.Passphrase}
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
