/**
 * Vault / Passcode Method
 */

import React, { Component } from 'react';
import { Alert, View, Text, Animated, LayoutAnimation, KeyboardEvent, InteractionManager } from 'react-native';

import FingerprintScanner from 'react-native-fingerprint-scanner';

import { SecurePinInput, Button } from '@components/General';

import { AuthenticationService } from '@services';

import { Prompt } from '@common/helpers/interface';
import { Keyboard } from '@common/helpers/keyboard';

import { BiometryType } from '@store/types';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

import { MethodsContext } from '../../Context';
import { AuthMethods } from '../../types';
/* types ==================================================================== */
export interface Props {}

export interface State {
    isBiometricAvailable: boolean;
    biometricMethod: BiometryType;
    hapticFeedback: boolean;
    offsetBottom: number;
}
/* Component ==================================================================== */
class PasscodeMethod extends Component<Props, State> {
    static contextType = MethodsContext;
    context: React.ContextType<typeof MethodsContext>;

    private contentView: View;
    private securePinInput: SecurePinInput;
    private animatedColor: Animated.Value;

    constructor(props: Props, context: React.ContextType<typeof MethodsContext>) {
        super(props);

        const { coreSettings } = context;

        this.state = {
            isBiometricAvailable: false,
            hapticFeedback: coreSettings.hapticFeedback,
            biometricMethod: coreSettings.biometricMethod,
            offsetBottom: 0,
        };

        this.animatedColor = new Animated.Value(0);
    }

    componentDidMount() {
        Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);

        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();

        InteractionManager.runAfterInteractions(() => {
            this.setBiometricStatus().then(this.startAuthentication);
        });
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

    setBiometricStatus = () => {
        const { coreSettings } = this.context;

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            return FingerprintScanner.isSensorAvailable()
                .then(() => {
                    if (coreSettings.biometricMethod !== BiometryType.None) {
                        this.setState({
                            isBiometricAvailable: true,
                        });
                    }
                    return resolve(false);
                })
                .catch(() => {
                    return resolve(false);
                });
        });
    };

    startAuthentication = () => {
        const { isBiometricAvailable } = this.state;

        if (isBiometricAvailable) {
            this.requestBiometricAuthenticate(true);
        } else if (this.securePinInput) {
            // focus the input
            this.securePinInput.focus();
        }
    };

    onSuccessBiometricAuthenticate = () => {
        const { coreSettings, sign } = this.context;
        const { passcode } = coreSettings;

        sign(AuthMethods.BIOMETRIC, { encryptionKey: passcode });
    };

    onSuccessPasscodeAuthenticate = (encryptedPasscode: string) => {
        const { sign } = this.context;

        sign(AuthMethods.PIN, { encryptionKey: encryptedPasscode });
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
                    Prompt(Localize.t('global.error'), Localize.t('global.invalidBiometryAuth'), [], {
                        type: 'default',
                    });
                }
            })
            .finally(FingerprintScanner.release);
    };

    onPasscodeEntered = (passcode: string) => {
        const { onInvalidAuth } = this.context;

        AuthenticationService.checkPasscode(passcode)
            .then(this.onSuccessPasscodeAuthenticate)
            .catch((e) => {
                this.securePinInput.clearInput();

                if (e?.message === Localize.t('global.invalidPasscode')) {
                    onInvalidAuth(AuthMethods.PIN);
                } else {
                    Alert.alert(Localize.t('global.error'), e.message);
                }
            });
    };

    render() {
        const { dismiss } = this.context;
        const { offsetBottom, hapticFeedback, biometricMethod, isBiometricAvailable } = this.state;

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
                        <View style={[AppStyles.flex1, AppStyles.paddingLeftSml, AppStyles.paddingRightSml]}>
                            <Text numberOfLines={1} style={[AppStyles.p, AppStyles.bold]}>
                                {Localize.t('global.signing')}
                            </Text>
                        </View>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                            <Button
                                light
                                numberOfLines={1}
                                label={Localize.t('global.cancel')}
                                roundedSmall
                                onPress={dismiss}
                            />
                        </View>
                    </View>
                    <View style={[AppStyles.row, AppStyles.paddingTopSml]}>
                        <View style={[AppStyles.container, AppStyles.centerContent]}>
                            <Text
                                style={[
                                    AppStyles.subtext,
                                    AppStyles.bold,
                                    AppStyles.textCenterAligned,
                                    AppStyles.paddingTopSml,
                                ]}
                            >
                                {Localize.t('global.pleaseEnterYourPasscode')}
                            </Text>

                            <SecurePinInput
                                ref={(r) => {
                                    this.securePinInput = r;
                                }}
                                onInputFinish={this.onPasscodeEntered}
                                length={6}
                                enableHapticFeedback={hapticFeedback}
                            />

                            {isBiometricAvailable && (
                                <View style={AppStyles.paddingTopSml}>
                                    <Button
                                        label={`${biometricMethod}`}
                                        icon="IconFingerprint"
                                        roundedSmall
                                        secondary
                                        isDisabled={false}
                                        onPress={this.requestBiometricAuthenticate}
                                    />
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default PasscodeMethod;
