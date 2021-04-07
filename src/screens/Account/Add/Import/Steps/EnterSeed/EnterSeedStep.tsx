/**
 * Import Account/familySeed Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert } from 'react-native';

import { derive } from 'xrpl-accountlib';
import { StringType, XrplSecret } from 'xumm-string-decode';

import Localize from '@locale';
// components
import { Button, TextInput, Spacer, KeyboardAwareScrollView, Footer } from '@components/General';

import { ConvertCodecAlphabet } from '@common/utils/codec';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    secret: string;
}

/* Component ==================================================================== */
class EnterSeedStep extends Component<Props, State> {
    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            secret: null,
        };
    }

    driveFamilySeed = () => {
        const { alternativeSeedAlphabet } = this.context;
        const { secret } = this.state;
        try {
            let xrplSecret = secret;
            // if alternative alphabet set then change
            if (alternativeSeedAlphabet) {
                const { alphabet } = alternativeSeedAlphabet;
                if (typeof alphabet === 'string') {
                    xrplSecret = ConvertCodecAlphabet(secret, alphabet);
                }
            }
            const account = derive.familySeed(xrplSecret);
            this.goNext(account);
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidFamilySeed'));
        }
    };

    derivePrivateKey = () => {
        const { secret } = this.state;
        try {
            const account = derive.privatekey(secret);
            this.goNext(account);
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidHexPrivateKey'));
        }
    };

    goNext = (account: any) => {
        const { goNext, setImportedAccount } = this.context;

        // set imported account
        setImportedAccount(account, () => {
            goNext('ConfirmPublicKey');
        });
    };

    onNextPress = () => {
        const { secret } = this.state;

        try {
            // normal family seed
            if (secret.startsWith('s')) {
                this.driveFamilySeed();
            } else if (secret.length === 66 && secret.startsWith('00')) {
                // hex private key
                this.derivePrivateKey();
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('account.invalidFamilySeed'));
            }
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidFamilySeed'));
        }
    };

    onQRCodeRead = (result: XrplSecret) => {
        if (result.familySeed) {
            this.setState({
                secret: result.familySeed,
            });
        }
    };

    onTextChange = (value: string) => {
        this.setState({ secret: value.replace(/[^a-z0-9]/gi, '') });
    };

    render() {
        const { goBack, alternativeSeedAlphabet } = this.context;
        const { secret } = this.state;

        return (
            <SafeAreaView testID="account-import-enter-family-seed-view" style={[AppStyles.container]}>
                <KeyboardAwareScrollView
                    style={[AppStyles.flex1]}
                    contentContainerStyle={[AppStyles.paddingHorizontal]}
                >
                    <Text style={[AppStyles.p, AppStyles.bold, AppStyles.textCenterAligned]}>
                        {alternativeSeedAlphabet
                            ? Localize.t('account.toTurnYourSecretIntoXrplLedgerAccountPleaseEnterYourSecret')
                            : Localize.t('account.pleaseProvideFamilySeed')}
                    </Text>

                    <Spacer size={50} />

                    <TextInput
                        testID="seed-input"
                        placeholder={
                            alternativeSeedAlphabet
                                ? Localize.t('account.enterSecret')
                                : Localize.t('account.pleaseEnterYourFamilySeed')
                        }
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="visible-password"
                        inputStyle={styles.inputText}
                        onChangeText={this.onTextChange}
                        value={secret}
                        showScanner
                        scannerType={StringType.XrplSecret}
                        onScannerRead={this.onQRCodeRead}
                        numberOfLines={1}
                    />
                </KeyboardAwareScrollView>

                <Footer style={[AppStyles.centerAligned, AppStyles.row]}>
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
                            onPress={this.onNextPress}
                        />
                    </View>
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default EnterSeedStep;
