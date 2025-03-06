/**
 * Auth Modal
 * Auth with pin code or biometrics
 */

import React, { Component } from 'react';
import {
    View,
    Animated,
    Text,
    Alert,
    BackHandler,
    KeyboardEvent,
    LayoutAnimation,
    InteractionManager,
    NativeEventSubscription,
    SafeAreaView,
    Platform,
} from 'react-native';

import { CoreRepository } from '@store/repositories';
import { CoreModel } from '@store/models';

import { Prompt, VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import Keyboard from '@common/helpers/keyboard';

import StyleService from '@services/StyleService';

import { AppScreens } from '@common/constants';

import { AuthenticationService } from '@services';

import { BiometricErrors } from '@common/libs/biometric';
// components
import { Button, SecurePinInput, BlurView } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    canAuthorizeBiometrics: boolean;
    onSuccess: () => void;
    onDismissed?: () => void;
}

export interface State {
    coreSettings: CoreModel;
    isBiometricAvailable: boolean;
    // offsetBottom: number;
}
/* Component ==================================================================== */
class AuthenticateOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Auth;
    private contentViewRef: React.RefObject<View>;
    private securePinInputRef: React.RefObject<SecurePinInput>;

    private animatedColor: Animated.Value;
    private animateScale: Animated.Value;
    private animatedOpacity: Animated.Value;

    private backHandler: NativeEventSubscription | undefined;
    private mounted = false;

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
            coreSettings: CoreRepository.getSettings(),
            isBiometricAvailable: false,
            // offsetBottom: 0,
        };

        this.contentViewRef = React.createRef();
        this.securePinInputRef = React.createRef();

        this.animatedColor = new Animated.Value(0);
        this.animateScale = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(0);
    }

    componentDidMount() {
        // track component mount status
        this.mounted = true;

        Animated.parallel([
            Animated.spring(this.animateScale, {
                toValue: 1,
                velocity: 0,
                tension: 65,
                friction: 7,
                useNativeDriver: true,
            }),

            Animated.timing(this.animatedOpacity, {
                toValue: 1,
                duration: 250,
                useNativeDriver: true,
            }),
        ]).start();


        // listen on keyboard events
        Keyboard.addListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.addListener('keyboardWillHide', this.onKeyboardHide);

        // android back handler
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.dismiss);

        // animate the background color
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
        // track component mount status
        this.mounted = false;

        // remove all listeners
        if (this.backHandler) {
            this.backHandler.remove();
        }

        Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
        Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
    }

    startAuthentication = () => {
        // focus the input
        if (this.securePinInputRef.current) {
            this.securePinInputRef.current.focus();
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

    onKeyboardShow = (e: KeyboardEvent) => {
        if (this.contentViewRef.current && this.mounted) {
            this.contentViewRef.current.measure((x, y, width, height) => {
                const bottomView = (AppSizes.screen.height - height) / 2;
                const KeyboardHeight = e.endCoordinates.height + 100;

                if (bottomView < KeyboardHeight) {
                    LayoutAnimation.easeInEaseOut();
                    // this.setState({ offsetBottom: KeyboardHeight - bottomView });
                }
            });
        }
    };

    onKeyboardHide = () => {
        if (this.mounted) {
            LayoutAnimation.easeInEaseOut();
            // this.setState({ offsetBottom: 0 });
        }
    };

    close = () => {
        Keyboard.dismiss();
        Navigator.dismissOverlay();
    };

    dismiss = () => {
        const { onDismissed } = this.props;

        if (onDismissed) {
            onDismissed();
        }

        this.close();

        return true;
    };

    onSuccessAuthentication = () => {
        const { onSuccess } = this.props;

        if (typeof onSuccess === 'function') {
            onSuccess();
        }

        this.close();
    };

    requestBiometricAuthenticate = () => {
        AuthenticationService.authenticateBiometrics(Localize.t('global.authenticate'))
            .then(this.onSuccessAuthentication)
            .catch((error: any) => {
                let errorMessage;
                // biometric's has been changed
                if (error.name === BiometricErrors.ERROR_BIOMETRIC_HAS_BEEN_CHANGED) {
                    errorMessage = Localize.t('global.biometricChangeError');
                    // disable biometrics
                    this.setState(
                        {
                            isBiometricAvailable: false,
                        },
                        this.startAuthentication,
                    );
                } else if (error.name !== BiometricErrors.ERROR_USER_CANCEL) {
                    errorMessage = Localize.t('global.invalidBiometryAuth');
                }

                if (errorMessage) {
                    Prompt(Localize.t('global.error'), errorMessage);
                }
            });
    };

    onPasscodeEntered = (passcode: string) => {
        const { coreSettings } = this.state;

        AuthenticationService.authenticatePasscode(passcode)
            .then(this.onSuccessAuthentication)
            .catch((e) => {
                // wrong passcode entered
                if (coreSettings.hapticFeedback) {
                    VibrateHapticFeedback('notificationError');
                }

                if (this.securePinInputRef.current) {
                    this.securePinInputRef.current.clearInput();
                }

                Alert.alert(Localize.t('global.error'), e.toString());
            });
    };

    renderPasscode = () => {
        const { coreSettings, isBiometricAvailable } = this.state;
        const { canAuthorizeBiometrics } = this.props;

        // const { biometricMethod } = coreSettings;

        return (
            <View style={[AppStyles.centerContent]}>
                <SecurePinInput
                    ref={this.securePinInputRef}
                    onInputFinish={this.onPasscodeEntered}
                    length={6}
                    enableHapticFeedback={coreSettings.hapticFeedback}
                    supportBiometric={isBiometricAvailable && canAuthorizeBiometrics}
                    onBiometryPress={this.requestBiometricAuthenticate}
                    pinPadStyle={styles.pinInputPadding}
                    virtualKeyboard
                />

                {/* {isBiometricAvailable && canAuthorizeBiometrics && (
                    <View style={AppStyles.paddingTopSml}>
                        <Button
                            label={`${biometricMethod}`}
                            icon="IconFingerprint"
                            roundedSmall
                            light
                            isDisabled={false}
                            onPress={this.requestBiometricAuthenticate}
                        />
                    </View>
                )} */}
            </View>
        );
    };

    render() {
        // const { offsetBottom } = this.state;
        const transform = [
            {
                scale: this.animateScale.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 1],
                }),
            },
        ];

        return (
            <BlurView
                style={styles.blurView}
                blurAmount={Platform.OS === 'ios' ? 15 : 20}
                blurType={StyleService.isDarkMode() ? 'dark' : 'light'}
            >
                <SafeAreaView testID="lock-overlay" style={styles.safeAreaContainer}>
                    <Animated.View style={[{ transform, opacity: this.animatedOpacity }]}>
                        <View style={[
                            AppStyles.flex1,
                            AppStyles.paddingHorizontal,
                            AppStyles.marginTop,
                        ]}>
                            <Text style={[
                                AppStyles.h4,
                                AppStyles.marginTop,
                                AppStyles.bold,
                                AppStyles.textCenterAligned,
                            ]}>{Localize.t('global.authenticate')}</Text>
                            <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                                {Localize.t('global.pleaseEnterYourPasscode')}
                            </Text>
                        </View>
                        <View style={[AppStyles.row, AppStyles.paddingTopSml]}>{this.renderPasscode()}</View>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.centerContent]}>
                            <Button label={Localize.t('global.cancel')} roundedSmall contrast onPress={this.dismiss} />
                        </View>
                    </Animated.View>
                </SafeAreaView>
            </BlurView>
        );
    }
}

/* Export Component ==================================================================== */
export default AuthenticateOverlay;
