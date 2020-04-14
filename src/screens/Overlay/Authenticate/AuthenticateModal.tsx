/**
 * Auth Modal
 * auth with pin code or fingerprint/face id
 */

import React, { Component } from 'react';
import { View, Animated, Text, Alert, Platform, Keyboard, KeyboardEvent, LayoutAnimation } from 'react-native';

import FingerprintScanner from 'react-native-fingerprint-scanner';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';
import { BiometryType } from '@store/types';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

// components
import { SecurePinInput, Button } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    biometricAvailable: true;
    onDismissed: ({ success }: { success: boolean }) => void;
}

export interface State {
    coreSettings: CoreSchema;
    offsetBottom: number;
}
/* Component ==================================================================== */
class AuthenticateModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.Auth;
    private contentView: View = undefined;
    private animatedColor: Animated.Value;
    private securePinInput: SecurePinInput = undefined;

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

    componentWillUnmount() {
        if (Platform.OS === 'ios') {
            Keyboard.removeListener('keyboardWillShow', this.onKeyboardShow);
            Keyboard.removeListener('keyboardWillHide', this.onKeyboardHide);
        } else {
            Keyboard.removeListener('keyboardDidShow', this.onKeyboardShow);
            Keyboard.removeListener('keyboardDidHide', this.onKeyboardHide);
        }
    }

    componentDidMount() {
        // animate the background color
        Animated.timing(this.animatedColor, {
            toValue: 150,
            duration: 350,
            useNativeDriver: false,
        }).start();

        // focus the input
        setTimeout(() => {
            if (this.securePinInput) {
                this.securePinInput.focus();
            }
        }, 300);
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

    dismiss = (success?: boolean) => {
        const { onDismissed } = this.props;

        if (onDismissed) {
            onDismissed({
                success,
            });
        }
        Keyboard.dismiss();
        Navigator.dismissOverlay();
    };

    onSuccess = () => {
        this.dismiss(true);
    };

    requestBiometricAuthenticate = (system: boolean = false) => {
        FingerprintScanner.authenticate({ description: Localize.t('global.authenticate'), fallbackEnabled: true })
            .then(this.onSuccess)
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

    onPasscodeEntered = (passcode: string) => {
        CoreRepository.checkPasscode(passcode)
            .then(this.onSuccess)
            .catch(e => {
                Alert.alert(Localize.t('global.error'), e.toString());
            })
            .finally(() => {
                this.securePinInput.clearInput();
            });
    };

    renderPasscode = () => {
        const { coreSettings } = this.state;
        const { biometricAvailable } = this.props;

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

                {biometricMethod !== BiometryType.None && biometricAvailable && (
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
                            <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.authenticate')}</Text>
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
                    <View style={[AppStyles.row, AppStyles.paddingTopSml]}>{this.renderPasscode()}</View>
                </View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default AuthenticateModal;
