/**
 * Import Account/familySeed Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, Platform, KeyboardAvoidingView } from 'react-native';

import { derive } from 'xrpl-accountlib';
import { StringType, XrplSecret } from 'xumm-string-decode';

import Localize from '@locale';
// components
import { Button, TextInput, Spacer, Footer } from '@components/General';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    familySeed: string;
}

/* Component ==================================================================== */
class EnterSeedStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            familySeed: null,
        };
    }

    goNext = () => {
        const { goNext, setImportedAccount } = this.context;
        const { familySeed } = this.state;

        try {
            let account;

            if (familySeed.startsWith('s')) {
                account = derive.familySeed(familySeed);
            } else {
                account = derive.privatekey(familySeed);
            }

            // set imported account
            setImportedAccount(account, () => {
                goNext('ConfirmPublicKey');
            });
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidFamilySeed'));
        }
    };

    onQRCodeRead = (result: XrplSecret) => {
        if (result.familySeed) {
            this.setState({
                familySeed: result.familySeed,
            });
        }
    };

    render() {
        const { goBack } = this.context;
        const { familySeed } = this.state;

        return (
            <SafeAreaView testID="account-import-enter-family-seed-view" style={[AppStyles.container]}>
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseProvideFamilySeed')}
                </Text>

                <Spacer size={50} />

                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior="padding"
                    style={[AppStyles.flex1, AppStyles.paddingHorizontal]}
                >
                    <TextInput
                        testID="seed-input"
                        placeholder={Localize.t('account.pleaseEnterYourFamilySeed')}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="visible-password"
                        inputStyle={styles.inputText}
                        onChangeText={(value) => this.setState({ familySeed: value.replace(/[^a-z0-9]/gi, '') })}
                        value={familySeed}
                        showScanner
                        scannerType={StringType.XrplSecret}
                        onScannerRead={this.onQRCodeRead}
                        numberOfLines={1}
                    />
                </KeyboardAvoidingView>

                <Footer style={[AppStyles.centerAligned, AppStyles.row]}>
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
export default EnterSeedStep;
