/**
 * Import Account/SecretNumbers Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert } from 'react-native';
import { derive } from 'xrpl-accountlib';
import { ImportSteps } from '@screens/Account/Add/Import';

import Localize from '@locale';
// components
import { Button, SecretNumberInput, Footer } from '@components';
// style
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props {
    goBack: (step?: ImportSteps, settings?: any) => void;
    goNext: (step?: ImportSteps, settings?: any) => void;
}

export interface State {
    allFilled: boolean;
}

/* Component ==================================================================== */
class EnterSecretNumbers extends Component<Props, State> {
    secretNumberInput: SecretNumberInput;

    constructor(props: Props) {
        super(props);

        this.state = {
            allFilled: false,
        };
    }

    goNext = () => {
        const { goNext } = this.props;

        const secretNumber = this.secretNumberInput.getNumbers();

        try {
            const account = derive.secretNumbers(secretNumber);
            goNext('ConfirmPublicKey', { importedAccount: account });
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidSecretNumber'));
        }
    };

    render() {
        const { allFilled } = this.state;
        const { goBack } = this.props;
        return (
            <SafeAreaView testID="account-import-enter-secretNumbers" style={[AppStyles.container]}>
                <Text
                    style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontalSml]}
                >
                    {Localize.t('account.pleaseEnterYourSecretNumber')}
                </Text>

                <View style={[AppStyles.contentContainer, AppStyles.paddingHorizontal, AppStyles.centerAligned]}>
                    <SecretNumberInput
                        ref={r => {
                            this.secretNumberInput = r;
                        }}
                        onAllFilled={filled => {
                            this.setState({
                                allFilled: filled,
                            });
                        }}
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
                            isDisabled={!allFilled}
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
export default EnterSecretNumbers;
