/**
 * Vault Modal
 * Sign json tx and return blob/signature
 */

import React, { Component } from 'react';
import { View, Animated, Text, Alert, Platform, Keyboard, KeyboardEvent, LayoutAnimation, Linking } from 'react-native';

import * as AccountLib from 'xrpl-accountlib';

import FingerprintScanner from 'react-native-fingerprint-scanner';
import RNTangemSdk, { Card } from 'tangem-sdk-react-native';

import Flag from '@common/libs/ledger/parser/common/flag';
import { CoreRepository, AccountRepository } from '@store/repositories';
import { AccountSchema, CoreSchema } from '@store/schemas/latest';
import { AccessLevels, EncryptionLevels, BiometryType, AccountTypes } from '@store/types';

import { TransactionJSONType, SignedObjectType } from '@common/libs/ledger/types';

import Vault from '@common/libs/vault';

import { AuthenticationService } from '@services';

import { VibrateHapticFeedback, Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, SecurePinInput, PasswordInput } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */

enum AuthMethods {
    PIN = 'PIN',
    BIOMETRIC = 'BIOMETRIC',
    PASSPHRASE = 'PASSPHRASE',
    TANGEM = 'TANGEM',
    OTHER = 'OTHER',
}

export interface Props {
    account: AccountSchema;
    txJson: TransactionJSONType;
    multiSign?: boolean;
    onDismissed: () => void;
    onSign: (signedObject: SignedObjectType) => void;
}

export interface State {
    signWith: AccountSchema;
    passphrase: string;
    coreSettings: CoreSchema;
    offsetBottom: number;
    isSensorAvailable: boolean;
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
            isSensorAvailable: false,
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
        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();

        this.setSignerAccount()
            .then(this.startAuthentication)
            .catch((e: any) => {
                this.dismiss();
                Alert.alert(Localize.t('global.error'), e.toString());
            });
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

    startAuthentication = () => {
        const { signWith } = this.state;

        switch (signWith.encryptionLevel) {
            case EncryptionLevels.Passcode:
                this.startBiometricAuthentication();
                break;
            case EncryptionLevels.Passphrase:
                this.startPassphraseAuthentication();
                break;
            case EncryptionLevels.Physical:
                this.startPhysicalAuthentication();
                break;
            default:
                break;
        }
    };

    startPhysicalAuthentication = () => {
        const { signWith } = this.state;

        switch (signWith.type) {
            case AccountTypes.Tangem: {
                this.signWithTangemCard();
                break;
            }
            default:
                break;
        }
    };

    startPassphraseAuthentication = () => {
        // focus the input
        setTimeout(() => {
            if (this.passwordInput) {
                this.passwordInput.focus();
            }
        }, 300);
    };

    startBiometricAuthentication = () => {
        const { coreSettings } = this.state;

        FingerprintScanner.isSensorAvailable()
            .then(() => {
                this.setState(
                    {
                        isSensorAvailable: true,
                    },
                    () => {
                        // if biometry sets by default switch to biometry for faster result
                        if (coreSettings.biometricMethod !== BiometryType.None) {
                            setTimeout(() => {
                                this.requestBiometricAuthenticate(true);
                            }, 500);
                        } else {
                            // focus the input
                            setTimeout(() => {
                                if (this.securePinInput) {
                                    this.securePinInput.focus();
                                }
                            }, 300);
                        }
                    },
                );
            })
            .catch(() => {
                // focus the input
                setTimeout(() => {
                    if (this.securePinInput) {
                        this.securePinInput.focus();
                    }
                }, 300);
            });
    };

    setSignerAccount = (): Promise<AccountSchema> => {
        const { account } = this.props;

        return new Promise((resolve, reject) => {
            let signWith = account;

            if (this.shouldSignWithRegularKey()) {
                // check if regular key is imported in XUMM
                const regularAccount = AccountRepository.findOne({ address: account.regularKey }) as AccountSchema;

                if (!regularAccount) {
                    return reject(new Error(Localize.t('account.masterKeyForThisAccountDisableRegularKeyNotFound')));
                }

                if (regularAccount.accessLevel !== AccessLevels.Full) {
                    return reject(
                        new Error(Localize.t('account.regularKeyAccountForThisAccountDoesNotImportedWithSignAccess')),
                    );
                }

                signWith = regularAccount;
            }

            return this.setState(
                {
                    signWith,
                },
                () => {
                    return resolve(signWith);
                },
            );
        });
    };

    shouldSignWithRegularKey = (): boolean => {
        const { account } = this.props;

        // check for account regular key set
        const flags = new Flag('Account', account.flags);
        const accountFlags = flags.parse();

        return account.regularKey && (accountFlags.disableMasterKey || account.accessLevel === AccessLevels.Readonly);
    };

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
        FingerprintScanner.authenticate({
            description: Localize.t('global.signingTheTransaction'),
            fallbackEnabled: true,
            // @ts-ignore
            fallbackTitle: Localize.t('global.enterPasscode'),
        })
            .then(this.onSuccessBiometricAuthenticate)
            .catch((error: any) => {
                if (system) return;
                if (error.name !== 'UserCancel') {
                    Alert.alert(Localize.t('global.error'), Localize.t('global.invalidBiometryAuth'));
                }
            })
            .finally(() => {
                FingerprintScanner.release();
            });
    };

    onSuccessBiometricAuthenticate = () => {
        const { coreSettings } = this.state;

        const { passcode } = coreSettings;
        this.openVault(passcode, AuthMethods.BIOMETRIC);
    };

    onInvalidAuth = (method: AuthMethods) => {
        const { coreSettings } = this.state;

        // wrong passcode entered
        if (coreSettings.hapticFeedback) {
            VibrateHapticFeedback('notificationError');
        }

        let title = '';
        let content = '';

        switch (method) {
            case AuthMethods.PIN:
                title = Localize.t('global.incorrectPasscode');
                content = Localize.t('global.thePasscodeYouEnteredIsIncorrectExplain');
                break;
            case AuthMethods.PASSPHRASE:
                title = Localize.t('global.incorrectPassword');
                content = Localize.t('global.thePasswordYouEnteredIsIncorrectExplain');
                break;
            default:
                title = Localize.t('global.error');
                content = Localize.t('global.invalidAuth');
        }

        Prompt(
            title,
            content,
            [
                {
                    text: Localize.t('global.troubleshoot'),
                    onPress: this.openTroubleshootLink,
                },
                { text: Localize.t('global.tryAgain') },
            ],
            { type: 'default' },
        );
    };

    onPasscodeEntered = (passcode: string) => {
        AuthenticationService.checkPasscode(passcode)
            .then((encryptedPasscode) => {
                this.openVault(encryptedPasscode, AuthMethods.PIN);
            })
            .catch((e) => {
                this.securePinInput.clearInput();

                if (e?.message === Localize.t('global.invalidPasscode')) {
                    this.onInvalidAuth(AuthMethods.PIN);
                } else {
                    Alert.alert(Localize.t('global.error'), e.message);
                }
            });
    };

    onPassphraseEntered = () => {
        const { passphrase } = this.state;
        this.openVault(passphrase, AuthMethods.PASSPHRASE);
    };

    openTroubleshootLink = () => {
        const url = `http://xumm.app/redir/faq/account-signing-password/${Localize.getCurrentLocale()}`;
        Linking.canOpenURL(url).then((supported) => {
            if (supported) {
                Linking.openURL(url);
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
            }
        });
    };

    openVault = async (encryptionKey: string, method: AuthMethods) => {
        const { signWith } = this.state;

        if (!encryptionKey) {
            return;
        }

        const privateKey = await Vault.open(signWith.publicKey, encryptionKey);

        if (privateKey) {
            this.signWithPrivateKey(privateKey, method);
        } else {
            this.onInvalidAuth(method);
        }
    };

    signWithTangemCard = async () => {
        const { txJson, multiSign } = this.props;
        const { signWith } = this.state;

        const { cardId, walletPublicKey } = signWith.additionalInfo as Card;

        const preparedTx = AccountLib.rawSigning.prepare(txJson, walletPublicKey, multiSign);

        // start tangem session
        await RNTangemSdk.startSession();

        // run sign command
        await RNTangemSdk.sign(cardId, [preparedTx.hashToSign])
            .then((resp) => {
                const { signature } = resp;

                const sig = signature instanceof Array ? signature[0] : signature;

                let signedObject = undefined as SignedObjectType;

                if (multiSign) {
                    signedObject = AccountLib.rawSigning.completeMultiSigned(txJson, [
                        {
                            pubKey: walletPublicKey,
                            signature: sig,
                        },
                    ]);
                } else {
                    signedObject = AccountLib.rawSigning.complete(preparedTx, sig);
                }

                // include sign method
                signedObject = { ...signedObject, signMethod: AuthMethods.TANGEM };

                setTimeout(() => {
                    this.onSign(signedObject);
                }, 2000);
            })
            .catch(this.dismiss)
            .finally(() => {
                setTimeout(() => {
                    RNTangemSdk.stopSession();
                }, 10000);
            });
    };

    signWithPrivateKey = async (privateKey: string, method: AuthMethods) => {
        const { txJson, multiSign } = this.props;

        let signer = AccountLib.derive.privatekey(privateKey);

        // check if multi sign
        if (multiSign) {
            signer = signer.signAs(signer.address);
        }

        let signedObject = AccountLib.sign(txJson, signer) as SignedObjectType;

        signedObject = { ...signedObject, signMethod: method };

        this.onSign(signedObject);
    };

    onSign = (signedObject: SignedObjectType) => {
        const { onSign } = this.props;

        if (typeof onSign === 'function') {
            onSign(signedObject);
        }

        Navigator.dismissOverlay();
    };

    renderPasscodeChallenge = () => {
        const { coreSettings, isSensorAvailable } = this.state;

        const { biometricMethod } = coreSettings;

        return (
            <View style={[AppStyles.container, AppStyles.centerContent]}>
                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingTopSml]}>
                    {Localize.t('global.pleaseEnterYourPasscode')}
                </Text>

                <SecurePinInput
                    ref={(r) => {
                        this.securePinInput = r;
                    }}
                    onInputFinish={this.onPasscodeEntered}
                    length={6}
                    enableHapticFeedback={coreSettings.hapticFeedback}
                />

                {biometricMethod !== BiometryType.None && isSensorAvailable && (
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

    renderPassphraseChallenge = () => {
        const { signWith } = this.state;

        return (
            <View style={[AppStyles.container, AppStyles.centerContent]}>
                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingTopSml]}>
                    {Localize.t('account.PleaseEnterYourPasswordForAccount')}
                    <Text style={AppStyles.colorBlue}> &#34;{signWith.label}&#34;</Text>
                </Text>

                <Spacer size={40} />

                <PasswordInput
                    testID="passphrase-input"
                    ref={(r) => {
                        this.passwordInput = r;
                    }}
                    placeholder={Localize.t('account.enterPassword')}
                    onChange={(passphrase) => {
                        this.setState({ passphrase });
                    }}
                    autoFocus
                />

                <Spacer size={20} />

                <View style={[AppStyles.paddingTopSml, AppStyles.row]}>
                    <Button
                        testID="sign-button"
                        rounded
                        label={Localize.t('global.sign')}
                        onPress={this.onPassphraseEntered}
                    />
                </View>
            </View>
        );
    };

    renderPhysicalChallenge = () => {
        return (
            <View style={[AppStyles.container, AppStyles.centerContent]}>
                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingTopSml]}>
                    Not Supported
                </Text>
            </View>
        );
    };

    renderChallenge = () => {
        const { account } = this.props;
        const { signWith } = this.state;

        const encryptionLevel = signWith ? signWith.encryptionLevel : account.encryptionLevel;

        switch (encryptionLevel) {
            case EncryptionLevels.Passcode:
                return this.renderPasscodeChallenge();
            case EncryptionLevels.Passphrase:
                return this.renderPassphraseChallenge();
            case EncryptionLevels.Physical:
                return this.renderPhysicalChallenge();
            default:
                return null;
        }
    };

    render() {
        const { signWith, offsetBottom } = this.state;

        // don't render anything for Tangem auth
        if (!signWith || signWith?.type === AccountTypes.Tangem) {
            return null;
        }

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <View
                    ref={(r) => {
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
