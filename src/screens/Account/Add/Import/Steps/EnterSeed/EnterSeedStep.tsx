/**
 * Import Account/familySeed Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, KeyboardTypeOptions, Platform } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';
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
import {
    FamilySeedAlgorithm,
    deriveFamilySeedAccount,
    isFamilySeedCurvePickerEligible,
    pickFamilySeedCurve,
} from '@common/utils/familySeedImport';
import { curveChoiceButtonLabel } from '@common/utils/mnemonicImport';

import LedgerService from '@services/LedgerService';
import NetworkService from '@services/NetworkService';

// style
import { AppStyles } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* types ==================================================================== */
export interface Props {}

export interface State {
    secret?: string;
    secretType?: FamilySeedAlgorithm;
    showSecret: boolean;
    keyboardType: KeyboardTypeOptions;
    isLoading: boolean;
}

/* Component ==================================================================== */
class EnterSeedStep extends Component<Props, State> {
    static contextType = StepsContext;
    declare context: React.ContextType<typeof StepsContext>;

    private curveDetectToken = 0;
    private curveDetectTimer: ReturnType<typeof setTimeout> | null = null;
    private curveDetectPromise: Promise<FamilySeedAlgorithm> | null = null;
    private userSelectedCurve = false;
    private pendingSecret?: string;

    constructor(props: Props) {
        super(props);

        this.state = {
            secret: undefined,
            secretType: 'secp256k1',
            showSecret: false,
            keyboardType: 'default',
            isLoading: false,
        };
    }

    componentWillUnmount() {
        this.curveDetectToken += 1;
        if (this.curveDetectTimer) {
            clearTimeout(this.curveDetectTimer);
            this.curveDetectTimer = null;
        }
    }

    resolveFamilySeed = (secret: string) => {
        const { alternativeSeedAlphabet } = this.context;
        let xrplSecret = secret;

        if (alternativeSeedAlphabet) {
            const { alphabet } = alternativeSeedAlphabet;
            if (typeof alphabet === 'string') {
                xrplSecret = ConvertCodecAlphabet(secret, alphabet);
            }
        }

        return xrplSecret;
    };

    confirmDifferentCurve = (
        curve: FamilySeedAlgorithm,
        address: string,
        secpAddress: string,
    ): Promise<FamilySeedAlgorithm | undefined> => {
        let network = '';
        try {
            network = NetworkService.getNetwork().name;
        } catch {
            network = '';
        }

        return new Promise((resolve) => {
            Prompt(
                Localize.t('account.familySeedDifferentCurveTitle'),
                `${Localize.t('account.familySeedDifferentCurveMessage', {
                    network,
                    curve,
                    address,
                })}\n\n${Localize.t('account.curveChoiceAddresses', {
                    secp: secpAddress,
                    ed: address,
                })}`,
                [
                    {
                        text: curveChoiceButtonLabel(Localize.t('account.mnemonicCurveSecp'), secpAddress),
                        onPress: () => resolve('secp256k1'),
                    },
                    {
                        text: curveChoiceButtonLabel(Localize.t('account.mnemonicCurveEd'), address),
                        onPress: () => resolve('ed25519'),
                    },
                    {
                        text: Localize.t('global.cancel'),
                        style: 'cancel',
                        onPress: () => resolve(undefined),
                    },
                ],
            );
        });
    };

    runCurveAutodetect = async (token: number, secret?: string): Promise<FamilySeedAlgorithm> => {
        if (!isFamilySeedCurvePickerEligible(secret) || this.userSelectedCurve || token !== this.curveDetectToken) {
            return this.getSecretType();
        }

        try {
            const picked = await pickFamilySeedCurve({
                secret: this.resolveFamilySeed(secret as string),
                getAccountInfo: (address) => LedgerService.getAccountInfo(address),
            });

            if (token !== this.curveDetectToken || this.userSelectedCurve) {
                return this.getSecretType();
            }

            // Typing must not prompt on node errors; Next re-checks and surfaces.
            if (picked.status === 'inconclusive' || !picked.confirm) {
                return picked.status === 'inconclusive' ? this.getSecretType() : picked.algorithm;
            }

            const chosen = await this.confirmDifferentCurve(
                picked.confirm.algorithm,
                picked.confirm.address,
                picked.confirm.secpAddress,
            );

            if (token !== this.curveDetectToken) {
                return this.getSecretType();
            }

            if (!chosen) {
                return this.getSecretType();
            }

            this.userSelectedCurve = true;
            this.setState({ secretType: chosen });
            return chosen;
        } catch {
            return this.getSecretType();
        }
    };

    scheduleCurveAutodetect = (secret?: string) => {
        const token = this.curveDetectToken;

        if (this.curveDetectTimer) {
            clearTimeout(this.curveDetectTimer);
        }

        this.curveDetectPromise = null;
        this.curveDetectTimer = setTimeout(() => {
            this.curveDetectTimer = null;
            this.curveDetectPromise = this.runCurveAutodetect(token, secret);
        }, 350);
    };

    applySecret = (secret?: string) => {
        this.userSelectedCurve = false;
        this.curveDetectToken += 1;
        this.pendingSecret = secret;

        this.setState({ secret, secretType: 'secp256k1' });
        this.scheduleCurveAutodetect(secret);
    };

    ensureCurveAutodetect = async (): Promise<FamilySeedAlgorithm> => {
        const secret = this.pendingSecret !== undefined ? this.pendingSecret : this.state.secret;

        if (this.curveDetectTimer) {
            clearTimeout(this.curveDetectTimer);
            this.curveDetectTimer = null;
            this.curveDetectPromise = this.runCurveAutodetect(this.curveDetectToken, secret);
        }

        if (this.curveDetectPromise) {
            try {
                return await this.curveDetectPromise;
            } catch {
                return 'secp256k1';
            }
        }

        return this.getSecretType();
    };

    chooseCurveWhenInconclusive = (secp: string, ed: string): Promise<FamilySeedAlgorithm | undefined> => {
        return new Promise((resolve) => {
            Prompt(
                Localize.t('account.chooseMnemonicCurve'),
                `${Localize.t('account.curveDetectionInconclusive')}\n\n${Localize.t('account.curveChoiceAddresses', {
                    secp,
                    ed,
                })}`,
                [
                    {
                        text: curveChoiceButtonLabel(Localize.t('account.mnemonicCurveSecp'), secp),
                        onPress: () => resolve('secp256k1'),
                    },
                    {
                        text: curveChoiceButtonLabel(Localize.t('account.mnemonicCurveEd'), ed),
                        onPress: () => resolve('ed25519'),
                    },
                    {
                        text: Localize.t('global.cancel'),
                        style: 'cancel',
                        onPress: () => resolve(undefined),
                    },
                ],
            );
        });
    };

    driveFamilySeed = async () => {
        const secret = this.pendingSecret !== undefined ? this.pendingSecret : this.state.secret;

        try {
            if (!secret) {
                throw new Error('Secret is required!');
            }

            this.setState({ isLoading: true });

            const xrplSecret = this.resolveFamilySeed(secret);

            if (!this.userSelectedCurve) {
                await this.ensureCurveAutodetect();
            }

            if (this.userSelectedCurve) {
                this.goNext(deriveFamilySeedAccount(xrplSecret, this.getSecretType()));
                return;
            }

            const picked = await pickFamilySeedCurve({
                secret: xrplSecret,
                getAccountInfo: (address) => LedgerService.getAccountInfo(address),
            });

            if (picked.status === 'inconclusive') {
                const chosen = await this.chooseCurveWhenInconclusive(picked.secp.address, picked.ed.address);
                if (!chosen) {
                    this.setState({ isLoading: false });
                    return;
                }
                this.userSelectedCurve = true;
                this.setState({ secretType: chosen });
                this.goNext(deriveFamilySeedAccount(xrplSecret, chosen));
                return;
            }

            if (picked.confirm) {
                const chosen = await this.confirmDifferentCurve(
                    picked.confirm.algorithm,
                    picked.confirm.address,
                    picked.confirm.secpAddress,
                );
                if (!chosen) {
                    this.setState({ isLoading: false });
                    return;
                }
                this.userSelectedCurve = true;
                this.setState({ secretType: chosen });
                this.goNext(deriveFamilySeedAccount(xrplSecret, chosen));
                return;
            }

            this.goNext(deriveFamilySeedAccount(xrplSecret, picked.algorithm));
        } catch (error) {
            this.setState({ isLoading: false });
            Alert.alert(Localize.t('global.error'), Localize.t('account.invalidFamilySeed'));
        }
    };

    derivePrivateKey = () => {
        const secret = this.pendingSecret !== undefined ? this.pendingSecret : this.state.secret;
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
        const secret = this.pendingSecret !== undefined ? this.pendingSecret : this.state.secret;

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
            this.applySecret(result.familySeed || result.hexPrivateKey);
        }
    };

    onTextChange = (value: string) => {
        this.applySecret(value.replace(/[^a-z0-9]/gi, ''));
    };

    getSecretType = (): FamilySeedAlgorithm => {
        const { secretType } = this.state;
        return secretType || 'secp256k1';
    };

    showKeypairTypePicker = () => {
        const { secretType } = this.state;

        Navigator.push<PickerModalProps>(AppScreens.Global.Picker, {
            title: Localize.t('global.curve'),
            description: Localize.t('global.selectCurve'),
            items: [
                { value: 'secp256k1', title: `secp256k1 (${Localize.t('global.default')})` },
                { value: 'ed25519', title: 'ed25519' },
            ],
            selected: secretType || 'secp256k1',
            onSelect: (v) => {
                this.userSelectedCurve = true;
                this.setState({
                    secretType: v.value as FamilySeedAlgorithm,
                });
            },
        });
    };

    render() {
        const { goBack, alternativeSeedAlphabet } = this.context;
        const { secret, showSecret, keyboardType, isLoading } = this.state;

        const isEligibleForKeyTypePicker = isFamilySeedCurvePickerEligible(secret);

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
                    {isEligibleForKeyTypePicker && (
                        <TouchableDebounce
                            testID="keypair-curve-row"
                            style={styles.row}
                            onPress={this.showKeypairTypePicker}
                        >
                            <View style={AppStyles.flex3}>
                                <Text numberOfLines={1} style={styles.label}>
                                    {Localize.t('account.keypairType')}
                                </Text>
                            </View>
                            <View style={[AppStyles.centerAligned, AppStyles.row]}>
                                <Text testID="keypair-curve-value" style={styles.value}>
                                    {this.getSecretType()}
                                </Text>
                                <Icon size={25} style={styles.rowIcon} name="IconChevronRight" />
                            </View>
                        </TouchableDebounce>
                    )}
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
                            isLoading={isLoading}
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
