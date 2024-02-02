/**
 * Vault / Passcode/Biometric Method
 */

import React, { Component } from 'react';
import { Alert, View, Text, Animated, LayoutAnimation, KeyboardEvent, InteractionManager } from 'react-native';

import { SecurePinInput, Button } from '@components/General';

import { AuthenticationService } from '@services';

import { Prompt } from '@common/helpers/interface';
import Keyboard from '@common/helpers/keyboard';

import { BiometricErrors } from '@common/libs/biometric';

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
    declare context: React.ContextType<typeof MethodsContext>;

    private contentViewRef: React.RefObject<View>;
    private animatedColor: Animated.Value;
    private mounted: boolean;
    private securePinInputRef: React.RefObject<SecurePinInput>;

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
        this.securePinInputRef = React.createRef();
        this.contentViewRef = React.createRef();
    }

    componentDidMount() {
        // track component mounted status
        this.mounted = true;

        // add listeners
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

    componentWillUnmount() {
        // track component mounted status
        this.mounted = false;

        // remove listeners
        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    }

    onKeyboardShow = (e: KeyboardEvent) => {
        if (this.contentViewRef.current && this.mounted) {
            this.contentViewRef.current.measure((x, y, width, height) => {
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
        if (this.mounted) {
            LayoutAnimation.easeInEaseOut();
            this.setState({ offsetBottom: 0 });
        }
    };

    setBiometricStatus = () => {
        return new Promise((resolve) => {
            AuthenticationService.isBiometricAvailable().then((status) => {
                this.setState(
                    {
                        isBiometricAvailable: status,
                    },
                    () => resolve(null),
                );
            });
        });
    };

    startAuthentication = () => {
        const { isBiometricAvailable } = this.state;

        if (isBiometricAvailable) {
            this.requestBiometricAuthenticate(true);
        } else if (this.securePinInputRef.current) {
            // focus the input
            this.securePinInputRef.current.focus();
        }
    };

    onSuccessBiometricAuthenticate = () => {
        const { coreSettings, sign } = this.context;
        const { passcode } = coreSettings;

        sign(AuthMethods.BIOMETRIC, { encryptionKey: passcode });
    };

    onSuccessPasscodeAuthenticate = (hashedPasscode: string) => {
        const { sign } = this.context;

        sign(AuthMethods.PIN, { encryptionKey: hashedPasscode });
    };

    requestBiometricAuthenticate = (system?: boolean) => {
        AuthenticationService.authenticateBiometrics(Localize.t('global.signingTheTransaction'))
            .then(this.onSuccessBiometricAuthenticate)
            .catch((error: any) => {
                let errorMessage;
                // biometric's has been changed
                if (error.name === BiometricErrors.ERROR_BIOMETRIC_HAS_BEEN_CHANGED) {
                    errorMessage = Localize.t('global.biometricChangeError');
                    // disable biometrics and start authentication again
                    this.setState(
                        {
                            isBiometricAvailable: false,
                        },
                        this.startAuthentication,
                    );
                } else if (error.name !== BiometricErrors.ERROR_USER_CANCEL) {
                    errorMessage = Localize.t('global.invalidBiometryAuth');
                }

                if (errorMessage && !system) {
                    Prompt(Localize.t('global.error'), errorMessage);
                }
            });
    };

    onPasscodeEntered = (passcode: string) => {
        const { onInvalidAuth } = this.context;

        AuthenticationService.authenticatePasscode(passcode)
            .then(this.onSuccessPasscodeAuthenticate)
            .catch((e) => {
                if (this.securePinInputRef.current) {
                    this.securePinInputRef.current.clearInput();
                }
                if (e?.message === Localize.t('global.invalidPasscode')) {
                    onInvalidAuth(AuthMethods.PIN);
                } else {
                    Alert.alert(Localize.t('global.error'), e.message);
                }
            });
    };

    render() {
        const { dismiss, isSigning } = this.context;
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
                <View ref={this.contentViewRef} style={[styles.visibleContent, { marginBottom: offsetBottom }]}>
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
                                ref={this.securePinInputRef}
                                isLoading={isSigning}
                                length={6}
                                enableHapticFeedback={hapticFeedback}
                                onInputFinish={this.onPasscodeEntered}
                            />

                            {isBiometricAvailable && (
                                <View style={AppStyles.paddingTopSml}>
                                    <Button
                                        label={`${biometricMethod}`}
                                        icon="IconFingerprint"
                                        roundedSmall
                                        secondary
                                        isDisabled={isSigning}
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
