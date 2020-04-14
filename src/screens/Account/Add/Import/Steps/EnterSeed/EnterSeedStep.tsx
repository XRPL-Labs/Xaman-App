/**
 * Import Account/familySeed Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, KeyboardAvoidingView } from 'react-native';
import { derive } from 'xrpl-accountlib';

import Localize from '@locale';
// components
import { Button, TextInput, Spacer, Footer } from '@components';

import { ImportSteps, AccountObject } from '@screens/Account/Add/Import/types';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    goBack: (step?: ImportSteps, settings?: AccountObject) => void;
    goNext: (step?: ImportSteps, settings?: AccountObject) => void;
}

export interface State {
    familySeed: string;
}

/* Component ==================================================================== */
class EnterSeedStep extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            familySeed: null,
        };
    }

    goNext = () => {
        const { goNext } = this.props;
        const { familySeed } = this.state;

        try {
            const account = derive.familySeed(familySeed);
            goNext('ConfirmPublicKey', { importedAccount: account });
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidFamilySeed'));
        }
    };

    render() {
        const { goBack } = this.props;
        return (
            <SafeAreaView testID="account-import-enter-family-seed" style={[AppStyles.container]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseProvideFamilySeed')}
                </Text>

                <Spacer size={50} />

                <KeyboardAvoidingView behavior="padding" style={[AppStyles.flex1, AppStyles.paddingHorizontal]}>
                    <TextInput
                        onChangeText={value => this.setState({ familySeed: value.replace(/[^a-z0-9]/gi, '') })}
                        placeholder={Localize.t('account.pleaseEnterYourFamilySeed')}
                        numberOfLines={1}
                        inputStyle={styles.inputText}
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
export default EnterSeedStep;
