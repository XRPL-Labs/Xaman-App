/**
 * Import Account/familySeed Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, KeyboardTypeOptions, Platform } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { derive } from 'xrpl-accountlib';
import { StringType, XrplSecret } from 'xumm-string-decode';

import { PickerModalProps } from '@screens/Global/Picker';

import Localize from '@locale';
// components
import {
    Button,
    TextInput,
    Spacer,
    KeyboardAwareScrollView,
    Footer,
    TouchableDebounce,
    // Switch,
    Icon,
} from '@components/General';

import { ConvertCodecAlphabet } from '@common/utils/codec';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    secret?: string;
    secretType?: string;
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
            secretType: 'secp256k1',
            showSecret: false,
            keyboardType: 'default',
        };
    }

    driveFamilySeed = () => {
        const { alternativeSeedAlphabet } = this.context;
        const { secret, secretType } = this.state;

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
            const account = derive.familySeed(xrplSecret, secretType === 'ed25519' ? {
                algorithm: secretType,
            } : undefined);

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

    getSecretType = (): string => {
        const { secretType } = this.state;
        return secretType || 'secp256k1';
    };

    showKeypairTypePicker = () => {
        const { secretType } = this.state;

        // let normalizedLocales = [];

        // for (const locale of locales) {
        //     normalizedLocales.push({
        //         value: locale.code,
        //         title: locale.nameLocal,
        //     });
        // }

        // normalizedLocales = sortBy(uniqBy(normalizedLocales, 'title'), 'title');

        Navigator.push<PickerModalProps>(AppScreens.Global.Picker, {
            title: Localize.t('global.language'),
            description: Localize.t('settings.selectLanguage'),
            items: [
                { value: 'secp256k1', title: `secp256k1 (${Localize.t('global.default')})` },
                { value: 'ed25519', title: 'ed25519' },
            ],
            selected: secretType || 'secp256k1',
            onSelect: v => {
                this.setState({
                    secretType: v.value,
                });
            },
        });
    };

    render() {
        const { goBack, alternativeSeedAlphabet } = this.context;
        const { secret, showSecret, keyboardType } = this.state;

        const isEligibleForKeyTypePicker = typeof secret === 'string' &&
            secret.trim().length > 15 &&
            secret.trim().match(/^s/) &&
            !secret.trim().match(/^sed/i);

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
                        inputStyle={
                            String(secret || '') === '' ? styles.inputTextEmpty : styles.inputText
                        }
                        onChangeText={this.onTextChange}
                        style={styles.textInput}
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
                    <Spacer size={20} />
                    { isEligibleForKeyTypePicker && 
                        <TouchableDebounce style={styles.row} onPress={this.showKeypairTypePicker}>
                            <View style={AppStyles.flex3}>
                                <Text numberOfLines={1} style={styles.label}>
                                    {Localize.t('account.keypairType')}
                                </Text>
                            </View>
                            <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                <Text style={styles.value}>{this.getSecretType()}</Text>
                                <Icon size={25} style={styles.rowIcon} name="IconChevronRight" />
                            </View>
                        </TouchableDebounce>
                    }
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
