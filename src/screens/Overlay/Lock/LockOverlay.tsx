/**
 * Lock screen
 */

import React, { Component } from 'react';
import { Image, InteractionManager, Keyboard, Platform, SafeAreaView, Text, View } from 'react-native';

import { CoreRepository } from '@store/repositories';

import { AppService, AuthenticationService, StyleService } from '@services';
import { AppStateStatus } from '@services/AppService';

import { BiometricErrors } from '@common/libs/biometric';

import { Navigator } from '@common/helpers/navigator';
import { Prompt, VibrateHapticFeedback } from '@common/helpers/interface';
import { AppScreens } from '@common/constants';

import { BlurView, SecurePinInput } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { Props, State } from './types';

/* Component ==================================================================== */
class LockOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Lock;

    private pendingBiometricAuthentication?: boolean;
    private securePinInputRef: React.RefObject<SecurePinInput>;

    static options() {
        return {
            statusBar: {
                style: StyleService.isDarkMode() ? 'light' : 'dark',
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            isBiometricAvailable: false,
            error: undefined,
        };

        this.securePinInputRef = React.createRef();

        // keep track of pending biometric authentications
        this.pendingBiometricAuthentication = false;
    }

    componentDidMount() {
        // add app state change listener
        AppService.addListener('appStateChange', this.onAppStateChange);

        // check for biometric authentication
        InteractionManager.runAfterInteractions(() => {
            // dismiss any keyboard when it's locked
            Keyboard.dismiss();
            // first set the biometric status and then start authentication
            this.setBiometricStatus().then(this.startAuthentication);
        });
    }

    componentWillUnmount() {
        AppService.removeListener('appStateChange', this.onAppStateChange);
    }

    onAppStateChange = (nextState: AppStateStatus) => {
        // resume the biometric authentication
        if (this.pendingBiometricAuthentication && nextState === AppStateStatus.Active) {
            this.pendingBiometricAuthentication = false;
            this.startAuthentication();
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

        // if any biometric method available then start the biometric authentication
        if (isBiometricAvailable) {
            if (AppService.currentAppState !== AppStateStatus.Active) {
                // so we wait for the app to come back to the Active state
                this.pendingBiometricAuthentication = true;
            } else {
                // start the authentication
                this.requestBiometricAuthenticate(true);
            }
        }
    };

    onUnlock = () => {
        const { onUnlock } = this.props;

        // close lock overlay
        Navigator.dismissOverlay();

        // run any callback
        if (typeof onUnlock === 'function') {
            onUnlock();
        }
    };

    onPasscodeEntered = (passcode: string) => {
        const { coreSettings } = this.state;

        AuthenticationService.authenticatePasscode(passcode)
            .then(this.onUnlock)
            .catch((e) => {
                // wrong passcode entered
                if (coreSettings.hapticFeedback) {
                    VibrateHapticFeedback('notificationError');
                }

                // clear passcode input
                if (this.securePinInputRef.current) {
                    this.securePinInputRef.current.clearInput();
                }

                // set the error message
                this.setState({
                    error: e.toString().replace('Error: ', ''),
                });
            });
    };

    requestBiometricAuthenticate = (system?: boolean) => {
        AuthenticationService.authenticateBiometrics(Localize.t('global.unlock'))
            .then(this.onUnlock)
            .catch((error) => {
                let errorMessage;
                // biometric's has been changed
                if (error.name === BiometricErrors.ERROR_BIOMETRIC_HAS_BEEN_CHANGED) {
                    errorMessage = Localize.t('global.biometricChangeError');
                    // disable biometrics
                    this.setState({
                        isBiometricAvailable: false,
                    });
                } else if (error.name !== BiometricErrors.ERROR_USER_CANCEL) {
                    // craft a new Error and ignore errors from user cancel
                    errorMessage = Localize.t('global.invalidBiometryAuth');
                }

                if (errorMessage && !system) {
                    Prompt(Localize.t('global.error'), errorMessage);
                }
            });
    };

    render() {
        const { error, coreSettings, isBiometricAvailable } = this.state;
        return (
            <BlurView
                style={styles.blurView}
                blurAmount={Platform.OS === 'ios' ? 15 : 20}
                blurType={StyleService.isDarkMode() ? 'dark' : 'light'}
            >
                <SafeAreaView testID="lock-overlay" style={styles.container}>
                    <View style={[AppStyles.centerAligned, AppStyles.paddingSml]}>
                        <Image style={styles.logo} source={StyleService.getImage('XamanLogo')} />
                    </View>
                    <View style={[AppStyles.centerAligned, AppStyles.paddingSml]}>
                        <Text style={[AppStyles.p, AppStyles.bold]}>
                            {Localize.t('global.pleaseEnterYourPasscode')}
                        </Text>
                    </View>

                    <View style={[AppStyles.flex5, AppStyles.flexEnd]}>
                        <Text
                            style={[
                                AppStyles.p,
                                AppStyles.bold,
                                AppStyles.textCenterAligned,
                                AppStyles.colorRed,
                                AppStyles.paddingSml,
                            ]}
                        >
                            {error}
                        </Text>
                        <SecurePinInput
                            ref={this.securePinInputRef}
                            virtualKeyboard
                            supportBiometric={isBiometricAvailable}
                            onBiometryPress={this.requestBiometricAuthenticate}
                            onInputFinish={this.onPasscodeEntered}
                            enableHapticFeedback={coreSettings.hapticFeedback}
                            length={6}
                        />
                    </View>
                </SafeAreaView>
            </BlurView>
        );
    }
}

/* Export Component ==================================================================== */
export default LockOverlay;
