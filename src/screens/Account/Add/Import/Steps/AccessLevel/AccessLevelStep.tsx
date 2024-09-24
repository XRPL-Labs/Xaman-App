/**
 * Import Account/AccessLevel Step
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';

import { Button, RadioButton, InfoMessage, Footer } from '@components/General';

import Localize from '@locale';

import { AccessLevels, EncryptionLevels } from '@store/types';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class AccessLevelStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    componentDidMount() {
        const { setAccessLevel, account } = this.context;

        // set default access level
        if (!account.accessLevel) {
            setAccessLevel(AccessLevels.Full);
        }
    }

    onRadioButtonPress = (level: AccessLevels) => {
        const { setAccessLevel } = this.context;
        setAccessLevel(level);
    };

    goNext = () => {
        const { goNext, setEncryptionLevel, account } = this.context;

        // set access level for account
        if (account.accessLevel === 'Full') {
            setEncryptionLevel(EncryptionLevels.Passcode, () => {
                goNext('SecretType');
            });
        } else {
            // if the account is readonly then set the encryption level to None
            setEncryptionLevel(EncryptionLevels.None, () => {
                goNext('EnterAddress');
            });
        }
    };

    render() {
        const { goBack, account } = this.context;

        return (
            <SafeAreaView testID="account-import-access-level-view" style={[AppStyles.contentContainer]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseSelectAccountType')}
                </Text>
                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        testID="full-access-radio-button"
                        onPress={this.onRadioButtonPress}
                        label={Localize.t('account.fullAccess')}
                        value={AccessLevels.Full}
                        description={Localize.t('account.fullAccessDesc')}
                        checked={account.accessLevel === AccessLevels.Full}
                    />
                    <RadioButton
                        testID="readonly-radio-button"
                        onPress={this.onRadioButtonPress}
                        label={Localize.t('account.readOnly')}
                        value={AccessLevels.Readonly}
                        description={Localize.t('account.readOnlyDesc')}
                        checked={account.accessLevel === AccessLevels.Readonly}
                    />

                    <InfoMessage
                        type="warning"
                        icon="IconInfo"
                        label={Localize.t('account.youCanAlwaysGetFullAccess')}
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
                    <View style={[AppStyles.flex5]}>
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
export default AccessLevelStep;
