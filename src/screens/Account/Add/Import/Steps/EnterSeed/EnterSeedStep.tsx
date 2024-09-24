/**
 * Import Account/familySeed Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, KeyboardTypeOptions, Platform } from 'react-native';

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
    secret?: string;
    showSecret: boolean;
    keyboardType: KeyboardTypeOptions;
}

/* Component ==================================================================== */
class EnterSeedStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    constructor(props: Props) {
        super(props);

        this.state = {
            secret: undefined,
            showSecret: false,
            keyboardType: 'default',
        };
    }

    driveFamilySeed = () => {
        const { alternativeSeedAlphabet } = this.context;
        const { secret } = this.state;

        try {
            if (!secret) {
                throw new Error('Secret is required!');
            }

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
        } catch (error) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidFamilySeed'));
        }
    };

    derivePrivateKey = () => {
        const { secret } = this.state;
        try {
            if (!secret) {
                throw new Error('Private key is required!');
            }

            const account = derive.privatekey(secret);

            this.goNext(account);
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidHexPrivateKey'));
        }
    };

    toggleShowSecret = () => {
        const { showSecret } = this.state;

        let keyboardType = 'default' as KeyboardTypeOptions;

        if (Platform.OS === 'android' && !showSecret) {
            keyboardType = 'visible-password';
        }

        this.setState({
            showSecret: !showSecret,
            keyboardType,
        });
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
            if (secret?.startsWith('s')) {
                this.driveFamilySeed();
            } else if (secret?.length === 66 && (secret.startsWith('00') || secret.startsWith('ED'))) {
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
        if (result?.familySeed || result?.hexPrivateKey) {
            this.setState({
                secret: result.familySeed || result.hexPrivateKey,
            });
        }
    };

    onTextChange = (value: string) => {
        this.setState({ secret: value.replace(/[^a-z0-9]/gi, '') });
    };

    render() {
        const { goBack, alternativeSeedAlphabet } = this.context;
        const { secret, showSecret, keyboardType } = this.state;

        return (
            <SafeAreaView testID="account-import-enter-family-seed-view" style={AppStyles.container}>
                <KeyboardAwareScrollView style={AppStyles.flex1} contentContainerStyle={AppStyles.paddingHorizontal}>
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
                        secureTextEntry={!showSecret}
                        keyboardType={keyboardType}
                        inputStyle={styles.inputText}
                        onChangeText={this.onTextChange}
                        value={secret}
                        showScanner
                        scannerType={StringType.XrplSecret}
                        onScannerRead={this.onQRCodeRead}
                        numberOfLines={1}
                    />
                    <Spacer size={20} />
                    <Button
                        roundedMini
                        light
                        isDisabled={!secret}
                        icon={showSecret ? 'IconEyeOff' : 'IconEye'}
                        iconSize={12}
                        label={showSecret ? Localize.t('account.hideSecret') : Localize.t('account.showSecret')}
                        onPress={this.toggleShowSecret}
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
                    <View style={AppStyles.flex5}>
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
