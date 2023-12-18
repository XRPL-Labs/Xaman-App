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
} from 'react-native';

import { CoreRepository } from '@store/repositories';
import { CoreModel } from '@store/models';

import { Prompt, VibrateHapticFeedback } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import Keyboard from '@common/helpers/keyboard';

import { AppScreens } from '@common/constants';

import { AuthenticationService } from '@services';

import { BiometricErrors } from '@common/libs/biometric';
// components
import { Button, SecurePinInput } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    canAuthorizeBiometrics: boolean;
    onDismissed: () => void;
    onSuccess: () => void;
}

export interface State {
    coreSettings: CoreModel;
    isBiometricAvailable: boolean;
    offsetBottom: number;
}
/* Component ==================================================================== */
class AuthenticateModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Auth;
    private contentViewRef: React.RefObject<View>;
    private securePinInputRef: React.RefObject<SecurePinInput>;

    private animatedColor: Animated.Value;
    private backHandler: NativeEventSubscription;
    private mounted: boolean;

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
            offsetBottom: 0,
        };

        this.contentViewRef = React.createRef();
        this.securePinInputRef = React.createRef();

        this.animatedColor = new Animated.Value(0);
    }

    componentDidMount() {
        // track component mount status
        this.mounted = true;

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

        const { biometricMethod } = coreSettings;

        return (
            <View style={[AppStyles.container, AppStyles.centerContent]}>
                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned, AppStyles.paddingTopSml]}>
                    {Localize.t('global.pleaseEnterYourPasscode')}
                </Text>

                <SecurePinInput
                    ref={this.securePinInputRef}
                    onInputFinish={this.onPasscodeEntered}
                    length={6}
                    enableHapticFeedback={coreSettings.hapticFeedback}
                />

                {isBiometricAvailable && canAuthorizeBiometrics && (
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
                )}
            </View>
        );
    };

    render() {
        const { offsetBottom } = this.state;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View style={[styles.container, { backgroundColor: interpolateColor }]}>
                <View ref={this.contentViewRef} style={[styles.visibleContent, { marginBottom: offsetBottom }]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                            <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.authenticate')}</Text>
                        </View>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                            <Button label={Localize.t('global.cancel')} roundedSmall light onPress={this.dismiss} />
                        </View>
                    </View>
                    <View style={[AppStyles.row, AppStyles.paddingTopSml]}>{this.renderPasscode()}</View>
                </View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default AuthenticateModal;
