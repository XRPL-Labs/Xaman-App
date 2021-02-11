/**
 * Import Account/EnterAddress Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, Keyboard, Platform, KeyboardAvoidingView } from 'react-native';

import { XRPL_Account, utils } from 'xrpl-accountlib';
import { StringType, XrplDestination } from 'xumm-string-decode';

// components
import { Button, TextInput, InfoMessage, Spacer, Footer } from '@components/General';

import { Navigator } from '@common/helpers/navigator';
import { getAccountInfo } from '@common/helpers/resolver';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isLoading: boolean;
    address: string;
}

/* Component ==================================================================== */
class EnterAddressStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            address: null,
        };
    }

    goNext = () => {
        const { goNext, setImportedAccount } = this.context;
        const { address } = this.state;

        const account = new XRPL_Account({ address });

        // set imported account
        setImportedAccount(account, () => {
            // go to next step
            goNext('LabelStep');
        });
    };

    validate = async () => {
        const { address } = this.state;

        this.setState({
            isLoading: true,
        });

        // validate xrp address
        if (!utils.isValidAddress(address)) {
            Alert.alert(Localize.t('global.error'), Localize.t('global.invalidAddress'));

            this.setState({
                isLoading: false,
            });
            return;
        }

        // check for exchange account
        const destinationInfo = await getAccountInfo(address);

        if (destinationInfo.possibleExchange) {
            Navigator.showAlertModal({
                type: 'warning',
                text: Localize.t('account.thisAddressAppearsToBeExchangeAddress'),
                buttons: [
                    {
                        text: Localize.t('global.back'),
                        onPress: () => {},
                        light: false,
                    },
                    {
                        text: Localize.t('global.continue'),
                        onPress: this.goNext,
                        type: 'dismiss',
                        light: true,
                    },
                ],
            });

            this.setState({
                isLoading: false,
            });
            return;
        }

        // everything is fine go to next step
        this.goNext();
    };

    onScannerRead = (result: XrplDestination) => {
        this.setState({
            address: result.to,
        });
    };

    render() {
        const { goBack } = this.context;
        const { address, isLoading } = this.state;
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
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="visible-password"
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
                            onPress={goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex5]}>
                        <Button
                            testID="next-button"
                            isDisabled={!address}
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.next')}
                            onPress={this.validate}
                            isLoading={isLoading}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default EnterAddressStep;
