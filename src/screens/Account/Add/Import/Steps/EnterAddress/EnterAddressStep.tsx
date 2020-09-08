/**
 * Import Account/EnterAddress Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, Keyboard, Platform, KeyboardAvoidingView } from 'react-native';

import { XRPL_Account, utils } from 'xrpl-accountlib';
import { StringType, XrplDestination } from 'xumm-string-decode';

import Localize from '@locale';
// components
import { Button, TextInput, InfoMessage, Spacer, Footer } from '@components/General';
// style
import { AppStyles } from '@theme';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    address: string;
}

/* Component ==================================================================== */
class EnterAddressStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            address: null,
        };
    }

    goNext = () => {
        const { goNext, setImportedAccount } = this.context;
        const { address } = this.state;

        if (utils.isValidAddress(address)) {
            const account = new XRPL_Account({ address });

            // set imported account
            setImportedAccount(account, () => {
                // go to next step
                goNext('LabelStep');
            });
        } else {
            Alert.alert(Localize.t('global.error'), Localize.t('global.invalidAddress'));
        }
    };

    onScannerRead = (result: XrplDestination) => {
        this.setState({
            address: result.to,
        });
    };

    render() {
        const { goBack } = this.context;
        const { address } = this.state;
        return (
            <SafeAreaView
                onResponderRelease={() => Keyboard.dismiss()}
                onStartShouldSetResponder={() => true}
                testID="account-import-enter-address-view"
                style={[AppStyles.container]}
            >
                <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingHorizontal]}>
                    {Localize.t('account.pleaseProvideAccountAddress')}
                </Text>

                <Spacer size={50} />

                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior="padding"
                    style={[AppStyles.flex1, AppStyles.paddingHorizontal]}
                >
                    <TextInput
                        testID="address-input"
                        value={address}
                        onChangeText={(value) => this.setState({ address: value.replace(/[^a-z0-9]/gi, '') })}
                        placeholder={Localize.t('account.pleaseEnterYourAddress')}
                        numberOfLines={1}
                        showScanner
                        scannerType={StringType.XrplDestination}
                        onScannerRead={this.onScannerRead}
                    />

                    <Spacer size={20} />

                    <InfoMessage type="info" label={Localize.t('account.importExchangeAddressReadonlyWarning')} />
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
                            isDisabled={!address}
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
export default EnterAddressStep;
