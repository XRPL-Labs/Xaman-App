/**
 * Import Account/AccessLevel Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text } from 'react-native';
import { ImportSteps } from '@screens/Account/Add/Import';

import { Button, RadioButton, InfoMessage, Footer } from '@components';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
// import styles from './styles';

/* types ==================================================================== */
export interface Props {
    goBack: (step?: ImportSteps, settings?: any) => void;
    goNext: (step?: ImportSteps, settings?: any) => void;
}

export interface State {
    accessLevel: string;
}

/* Component ==================================================================== */
class AccessLevelStep extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            accessLevel: 'Full',
        };
    }

    onRadioButtonPress = (level: string) => {
        this.setState({
            accessLevel: level,
        });
    };

    goNext = () => {
        const { goNext } = this.props;
        const { accessLevel } = this.state;
        if (accessLevel === 'Full') {
            goNext('AccountType', { accessLevel });
        } else {
            goNext('EnterAddress', { accessLevel });
        }
    };
    render() {
        const { goBack } = this.props;
        const { accessLevel } = this.state;
        return (
            <SafeAreaView testID="account-import-access-level" style={[AppStyles.contentContainer]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseSelectAccountType')}
                </Text>
                <View style={[AppStyles.contentContainer, AppStyles.centerContent, AppStyles.paddingSml]}>
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress('Full');
                        }}
                        label={Localize.t('account.fullAccess')}
                        description={Localize.t('account.fullAccessDesc')}
                        checked={accessLevel === 'Full'}
                    />
                    <RadioButton
                        onPress={() => {
                            this.onRadioButtonPress('Readonly');
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
export default AccessLevelStep;
