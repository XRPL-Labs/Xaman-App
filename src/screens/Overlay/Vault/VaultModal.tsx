/**
 * Vault Modal
 * get Private key for account from Vault
 */

import { isEmpty } from 'lodash';
import React, { Component } from 'react';
import { View, Animated, Text, Alert, Platform, Keyboard, KeyboardEvent, LayoutAnimation } from 'react-native';
import TouchID from 'react-native-touch-id';

import Flag from '@common/libs/ledger/parser/common/flag';
import { CoreRepository, AccountRepository } from '@store/repositories';
import { AccountSchema, CoreSchema } from '@store/schemas/latest';
import { AccessLevels, EncryptionLevels, BiometryType } from '@store/types';

import Vault from '@common/libs/vault';

import { Navigator } from '@common/helpers';
import { AppScreens } from '@common/constants';

// components
import { SecurePinInput, Button, PasswordInput, Spacer } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    onDismissed: () => void;
    onOpen: (privateKey: string) => void;
}

export interface State {
    signWith: AccountSchema;
    passphrase: string;
    coreSettings: CoreSchema;
    offsetBottom: number;
}
/* Component ==================================================================== */
class VaultModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Vault;
    private contentView: View = undefined;
    private animatedColor: Animated.Value;
    private securePinInput: SecurePinInput;
    private passwordInput: PasswordInput;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            signWith: undefined,
            passphrase: undefined,
            coreSettings: CoreRepository.getSettings(),
            offsetBottom: 0,
        };

        if (Platform.OS === 'ios') {
            Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);
        } else {
            Keyboard.addListener('keyboardDidShow', this.onKeyboardShow);
            Keyboard.addListener('keyboardDidHide', this.onKeyboardHide);
        }

        this.animatedColor = new Animated.Value(0);
    }

    componentDidMount() {
        const { account } = this.props;
        const { coreSettings } = this.state;

        // check for account regular key set
        const flags = new Flag('Account', account.flags);
        const accountFlags = flags.parse();

        let { encryptionLevel } = account;

        if (account.regularKey && accountFlags.disableMasterKey) {
            const regularAccount = AccountRepository.findOne({ address: account.regularKey }) as AccountSchema;
            if (isEmpty(regularAccount)) {
                // dismiss
                this.dismiss();

                Alert.alert(
                    Localize.t('global.error'),
                    Localize.t('account.masterKeyForThisAccountDisableRegularKeyNotFound'),
                );
                // return
                return;
            }

            if (regularAccount.accessLevel !== AccessLevels.Full) {
                // dismiss
                this.dismiss();
                Alert.alert(
                    Localize.t('global.error'),
                    Localize.t('account.regularKeyAccountForThisAccountDoesNotImportedWithSignAccess'),
                );
                // return
                return;
            }

            this.setState({
                signWith: regularAccount,
            });

            encryptionLevel = regularAccount.encryptionLevel;
        }

        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
        }).start();

        // if biometry sets by default switch to biometry for faster result
        if (encryptionLevel === EncryptionLevels.Passcode) {
            if (coreSettings.biometricMethod !== BiometryType.None) {
                setTimeout(() => {
                    this.requestBiometricAuthenticate(true);
                }, 500);
            } else {
                // focus the input
                setTimeout(() => {
                    this.securePinInput.focus();
                }, 300);
            }
        } else if (encryptionLevel === EncryptionLevels.Passphrase) {
            // focus the input
            setTimeout(() => {
                this.passwordInput.focus();
            }, 300);
        }
    }

    componentWillUnmount() {
        if (Platform.OS === 'ios') {
            Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
        } else {
            Keyboard.removeListener('keyboardDidShow', this.onKeyboardShow);
            Keyboard.removeListener('keyboardDidHide', this.onKeyboardHide);
        }
    }

    onKeyboardShow = (e: KeyboardEvent) => {
        if (this.contentView) {
            this.contentView.measure((x, y, width, height) => {
                const bottomView = (AppSizes.screen.height - height) / 2;
                const KeyboardHeight = e.endCoordinates.height + 100;

                if (bottomView < KeyboardHeight) {
                    LayoutAnimation.easeInEaseOut();
                    this.setState({ offsetBottom: KeyboardHeight - bottomView });
                }
            });
        }
    };

    onKeyboardHide = () => {
        LayoutAnimation.easeInEaseOut();
        this.setState({ offsetBottom: 0 });
    };

    dismiss = () => {
        const { onDismissed } = this.props;
        if (onDismissed) {
            onDismissed();
        }
        Keyboard.dismiss();
        Navigator.dismissOverlay();
    };

    requestBiometricAuthenticate = (system: boolean = false) => {
        const { coreSettings } = this.state;

        const optionalConfigObject = {
            title: Localize.t('global.authenticationRequired'),
            sensorErrorDescription: Localize.t('global.failed'),
            cancelText: Localize.t('global.cancel'),
            fallbackLabel: 'Show Passcode',
            unifiedErrors: true,
            passcodeFallback: true,
        };

        TouchID.authenticate(Localize.t('global.signingTheTransaction'), optionalConfigObject)
            .then(() => {
                const { passcode } = coreSettings;
                this.openVault(passcode);
            })
            .catch((error: any) => {
                if (system) return;
                if (error.code !== 'USER_CANCELED') {
                    Alert.alert(Localize.t('global.error'), Localize.t('global.invalidBiometryAuth'));
                }
            });
    };

    onPasscodeEntered = (passcode: string) => {
        CoreRepository.checkPasscode(passcode)
            .then(encryptedPasscode => {
                this.openVault(encryptedPasscode);
            })
            .catch(e => {
                Alert.alert(Localize.t('global.error'), e.toString());
            })
            .finally(() => {
                this.securePinInput.clearInput();
            });
    };

    onPassphraseEntered = () => {
        const { passphrase } = this.state;
        this.openVault(passphrase);
    };

    openVault = async (encryptionKey: string) => {
        const { account, onOpen } = this.props;
        const { signWith } = this.state;

        if (!encryptionKey) {
            return;
        }

        const privateKey = await Vault.open(signWith ? signWith.publicKey : account.publicKey, encryptionKey);

        if (!privateKey) {
            Alert.alert(Localize.t('global.error'), Localize.t('global.invalidAuth'));
        } else {
            onOpen(privateKey);
            Navigator.dismissOverlay();
        }
    };

    renderPasscode = () => {
        const { coreSettings } = this.state;

        const { biometricMethod } = coreSettings;

        return (
            <View style={[AppStyles.container, AppStyles.centerContent]}>
                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingTopSml]}>
                    {Localize.t('global.pleaseEnterYourPasscode')}
                </Text>

                <SecurePinInput
                    ref={r => {
                        this.securePinInput = r;
                    }}
                    onInputFinish={this.onPasscodeEntered}
                    length={6}
                />

                {biometricMethod !== BiometryType.None && (
                    <View style={AppStyles.paddingTopSml}>
                        <Button
                            label={`${biometricMethod}`}
                            icon="IconFingerprint"
                            roundedSmall
                            secondary
                            isDisabled={false}
                            onPress={() => {
                                this.requestBiometricAuthenticate();
                            }}
                        />
                    </View>
                )}
            </View>
        );
    };

    renderPassphrase = () => {
        const { signWith } = this.state;

        return (
            <View style={[AppStyles.container, AppStyles.centerContent]}>
                {signWith ? (
                    <Text
                        style={[
                            AppStyles.subtext,
                            AppStyles.bold,
                            AppStyles.textCenterAligned,
                            AppStyles.paddingTopSml,
                        ]}
                    >
                        Please enter your passphrase for account
                        <Text style={AppStyles.colorBlue}> &#34;{signWith.label}&#34;</Text>
                    </Text>
                ) : (
                    <Text
                        style={[
                            AppStyles.subtext,
                            AppStyles.bold,
                            AppStyles.textCenterAligned,
                            AppStyles.paddingTopSml,
                        ]}
                    >
                        Please enter your passphrase
                    </Text>
                )}

                <Spacer size={40} />

                <PasswordInput
                    ref={r => {
                        this.passwordInput = r;
                    }}
                    placeholder={Localize.t('account.enterPassphrase')}
                    onChange={passphrase => {
                        this.setState({ passphrase });
                    }}
                    autoFocus
                />

                <Spacer size={20} />

                <View style={[AppStyles.paddingTopSml, AppStyles.row]}>
                    <Button rounded label={Localize.t('global.sign')} onPress={this.onPassphraseEntered} />
                </View>
            </View>
        );
    };

    renderChallenge = () => {
        const { account } = this.props;
        const { signWith } = this.state;

        const encryptionLevel = signWith ? signWith.encryptionLevel : account.encryptionLevel;

        switch (encryptionLevel) {
            case EncryptionLevels.Passcode:
                return this.renderPasscode();
            case EncryptionLevels.Passphrase:
                return this.renderPassphrase();
            default:
                return this.renderPasscode();
        }
    };

    render() {
        const { offsetBottom } = this.state;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View
                onResponderRelease={this.dismiss}
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <View
                    ref={r => {
                        this.contentView = r;
                    }}
                    style={[styles.visibleContent, { marginBottom: offsetBottom }]}
                >
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                            <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.signing')}</Text>
                        </View>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                            <Button
                                label={Localize.t('global.cancel')}
                                roundedSmall
                                secondary
                                isDisabled={false}
                                onPress={this.dismiss}
                            />
                        </View>
                    </View>
                    <View style={[AppStyles.row, AppStyles.paddingTopSml]}>{this.renderChallenge()}</View>
                </View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default VaultModal;
