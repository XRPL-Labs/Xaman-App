/**
 * Lock screen
 */

import React, { Component } from 'react';
import { View, Text, SafeAreaView, Image, Platform, Keyboard } from 'react-native';
import FingerprintScanner from 'react-native-fingerprint-scanner';

import { BlurView } from '@react-native-community/blur';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';
import { BiometryType } from '@store/types';

import { AuthenticationService } from '@services';

import { Navigator } from '@common/helpers/navigator';
import { VibrateHapticFeedback } from '@common/helpers/interface';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

// components
import { SecurePinInput } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    onUnlock: () => void;
}

export interface State {
    error: string;
    isSensorAvailable: boolean;
    coreSettings: CoreSchema;
}
/* Component ==================================================================== */
class LockModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Lock;

    private securePinInput: SecurePinInput;
    private contentView: SafeAreaView;

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
            error: undefined,
            isSensorAvailable: false,
            coreSettings: CoreRepository.getSettings(),
        };
    }

    componentDidMount() {
        const { coreSettings } = this.state;

        // dismiss any keyboard when it's locked
        Keyboard.dismiss();

        // check for biometric auth
        FingerprintScanner.isSensorAvailable()
            .then(() => {
                this.setState({
                    isSensorAvailable: true,
                });
                if (coreSettings.biometricMethod !== BiometryType.None) {
                    setTimeout(() => {
                        this.requestBiometricAuthenticate();
                    }, 100);
                }
            })
            .catch(() => {});
    }

    onPasscodeEntered = (passcode: string) => {
        const { coreSettings } = this.state;

        AuthenticationService.checkPasscode(passcode)
            .then(this.onUnlock)
            .catch((e) => {
                // wrong passcode entered
                if (coreSettings.hapticFeedback) {
                    VibrateHapticFeedback('notificationError');
                }

                this.securePinInput.clearInput();

                this.setState({
                    error: e.toString().replace('Error: ', ''),
                });
            });
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

    onBiometricAuthenticateSuccess = () => {
        // update latest unlock app
        AuthenticationService.onSuccessAuthentication();
        this.onUnlock();
    };

    requestBiometricAuthenticate = () => {
        FingerprintScanner.authenticate({
            description: Localize.t('global.unlock'),
            fallbackEnabled: true,
            fallbackTitle: Localize.t('global.enterPasscode'),
        })
            .then(this.onBiometricAuthenticateSuccess)
            .catch(() => {})
            .finally(() => {
                FingerprintScanner.release();
            });
    };

    render() {
        const { error, coreSettings, isSensorAvailable } = this.state;
        return (
            <BlurView style={styles.blurView} blurAmount={Platform.OS === 'ios' ? 15 : 20} blurType="light">
                <SafeAreaView testID="lock-overlay" style={styles.container}>
                    <View style={[AppStyles.centerAligned, AppStyles.paddingSml]}>
                        <Image style={styles.logo} source={Images.xummLogo} />
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
                            ref={(r) => {
                                this.securePinInput = r;
                            }}
                            virtualKeyboard
                            supportBiometric={coreSettings.biometricMethod !== BiometryType.None && isSensorAvailable}
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
export default LockModal;
