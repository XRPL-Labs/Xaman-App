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

export interface State {
    accessLevel: AccessLevels;
}

/* Component ==================================================================== */
class AccessLevelStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            accessLevel: AccessLevels.Full,
        };
    }

    onRadioButtonPress = (level: AccessLevels) => {
        this.setState({
            accessLevel: level,
        });
    };

    goNext = () => {
        const { goNext, setAccessLevel, setEncryptionLevel } = this.context;
        const { accessLevel } = this.state;

        // set access level for account
        setAccessLevel(accessLevel, () => {
            if (accessLevel === 'Full') {
                goNext('SecretType');
            } else {
                // if the account is readonly then set the encryption level to None
                setEncryptionLevel(EncryptionLevels.None, () => {
                    goNext('EnterAddress');
                });
            }
        });
    };

    render() {
        const { goBack } = this.context;
        const { accessLevel } = this.state;
        return (
            <SafeAreaView testID="account-import-access-level-view" style={[AppStyles.contentContainer]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseSelectAccountType')}
                </Text>
                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        testID="full-access-radio-button"
                        onPress={() => {
                            this.onRadioButtonPress(AccessLevels.Full);
                        }}
                        label={Localize.t('account.fullAccess')}
                        description={Localize.t('account.fullAccessDesc')}
                        checked={accessLevel === 'Full'}
                    />
                    <RadioButton
                        testID="readonly-radio-button"
                        onPress={() => {
                            this.onRadioButtonPress(AccessLevels.Readonly);
                        }}
                        label={Localize.t('account.readOnly')}
                        description={Localize.t('account.readOnlyDesc')}
                        checked={accessLevel === 'Readonly'}
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
                            testID="next-button"
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
export default AccessLevelStep;
