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
    declare context: React.ContextType<typeof StepsContext>;

    componentDidMount() {
        const { account, setEncryptionLevel } = this.context;

        if (!account.encryptionLevel) {
            setEncryptionLevel(EncryptionLevels.Passcode);
        }
    }

    onRadioButtonPress = (level: EncryptionLevels) => {
        const { setEncryptionLevel } = this.context;

        setEncryptionLevel(level);
    };

    goNext = () => {
        const { goNext, account } = this.context;

        if (account.encryptionLevel === EncryptionLevels.Passphrase) {
            goNext('PassphraseStep');
        } else {
            goNext('LabelStep');
        }
    };
    render() {
        const { goBack, account } = this.context;

        return (
            <SafeAreaView testID="account-generate-security-view" style={AppStyles.container}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.chooseWisely')}
                </Text>
                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        testID="passcode-radio-button"
                        onPress={this.onRadioButtonPress}
                        description={Localize.t('account.passcodeOptionDesc')}
                        labelSmall={Localize.t('account.signWithPasscode')}
                        label={Localize.t('global.standard')}
                        value={EncryptionLevels.Passcode}
                        checked={account.encryptionLevel === EncryptionLevels.Passcode}
                    />
                    <RadioButton
                        testID="passphrase-radio-button"
                        onPress={this.onRadioButtonPress}
                        description={Localize.t('account.passwordOptionDesc')}
                        labelSmall={Localize.t('account.signWithPassword')}
                        label={Localize.t('global.extraSecurity')}
                        value={EncryptionLevels.Passphrase}
                        checked={account.encryptionLevel === EncryptionLevels.Passphrase}
                    />
                </View>
                <Footer style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[AppStyles.flex3, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={AppStyles.flex5}>
                        <Button
                            testID="next-button"
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
export default SecurityStep;
