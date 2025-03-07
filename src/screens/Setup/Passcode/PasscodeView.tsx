/**
 * Setup Passcode Screen
 */

import React, { Component } from 'react';

import { SafeAreaView, View, Text, Image, LayoutAnimation, ImageBackground, Alert } from 'react-native';

import { CoreRepository } from '@store/repositories';
import { CoreModel } from '@store/models';
import { BiometryType } from '@store/types';

import { Biometric } from '@common/libs/biometric';
import { Images } from '@common/helpers/images';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { VibrateHapticFeedback, Toast, Prompt } from '@common/helpers/interface';

import { PushNotificationsService, StyleService } from '@services';

import { Button, Spacer, Footer, SecurePinInput } from '@components/General';
import { isStrong } from '@components/General/PinInput/PinInput';

import Localize from '@locale';

import { FinishSetupViewProps } from '@screens/Setup/Finish';
import { BiometrySetupViewProps } from '@screens/Setup/Biometry';
import { PushNotificationSetupViewProps } from '@screens/Setup/PushNotification';

import { AppStyles } from '@theme';
import styles from './styles';
import onboardingStyles from '../../Onboarding/styles';

/* types ==================================================================== */
enum Steps {
    EXPLANATION = 'EXPLANATION',
    ENTER_PASSCODE = 'ENTER_PASSCODE',
    CONFIRM_PASSCODE = 'CONFIRM_PASSCODE',
}

export interface Props {}

export interface State {
    coreSettings: CoreModel;
    passcode: string;
    passcodeConfirm: string;
    currentStep: Steps;
    isLoading: boolean;
}

/* Component ==================================================================== */
class PasscodeSetupView extends Component<Props, State> {
    static screenName = AppScreens.Setup.Passcode;

    private pinInputRef: React.RefObject<SecurePinInput>;

    static options() {
        return { topBar: { visible: false } };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            passcode: '',
            passcodeConfirm: '',
            currentStep: Steps.EXPLANATION,
            isLoading: false,
        };

        this.pinInputRef = React.createRef();
    }

    onFinishStep = async () => {
        const { passcode } = this.state;

        try {
            // set loading
            this.setState({
                isLoading: true,
            });

            // hash/save passcode
            const hashedPasscode = await CoreRepository.setPasscode(passcode);

            // reload the core settings
            const coreSettings = CoreRepository.getSettings();

            // check if passcode is saved correctly
            if (!hashedPasscode || !coreSettings || coreSettings.passcode !== hashedPasscode) {
                Alert.alert(Localize.t('global.error'), Localize.t('setupPasscode.UnableToStoreThePasscode'));
                return;
            }
            // if biometric auth supported move to page
            if (await this.isBiometricSupported()) {
                Navigator.push<BiometrySetupViewProps>(AppScreens.Setup.Biometric, {});
                return;
            }

            // biometric is not supported
            CoreRepository.saveSettings({ biometricMethod: BiometryType.None });

            // if push notification already granted then go to last part
            const granted = await PushNotificationsService.checkPermission();
            if (granted) {
                Navigator.push<FinishSetupViewProps>(AppScreens.Setup.Finish, {});
                return;
            }

            // go to the next step
            Navigator.push<PushNotificationSetupViewProps>(AppScreens.Setup.PushNotification, {});
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('global.unexpectedErrorOccurred'));
        } finally {
            // clear state
            setTimeout(() => {
                this.setState({
                    passcode: '',
                    passcodeConfirm: '',
                    currentStep: Steps.EXPLANATION,
                    isLoading: false,
                });
            }, 500);
        }
    };

    onNext = () => {
        const { currentStep } = this.state;

        LayoutAnimation.easeInEaseOut();

        if (currentStep === Steps.EXPLANATION) {
            this.setState({
                currentStep: Steps.ENTER_PASSCODE,
            });
        } else if (currentStep === Steps.ENTER_PASSCODE) {
            this.setState(
                {
                    currentStep: Steps.CONFIRM_PASSCODE,
                },
                () => {
                    if (this.pinInputRef?.current) {
                        this.cleanPinInput();
                        // this.pinInputRef?.current.focus();
                    }
                },
            );
        } else {
            this.onFinishStep();
        }
    };

    onBack = () => {
        const { currentStep } = this.state;

        // animation the step change
        LayoutAnimation.easeInEaseOut();

        if (currentStep === Steps.ENTER_PASSCODE) {
            this.setState({
                passcode: '',
                currentStep: Steps.EXPLANATION,
            });
        } else {
            this.setState(
                {
                    passcode: '',
                    passcodeConfirm: '',
                    currentStep: Steps.ENTER_PASSCODE,
                },
                () => {
                    if (this.pinInputRef?.current) {
                        this.cleanPinInput();
                    }
                },
            );
        }
    };

    isBiometricSupported = () => {
        // console.log('isBiometricSupported')
        return new Promise((resolve) => {
            Biometric.isSensorAvailable()
                .then(() => {
                    // console.log('isBiometricSupported true')
                    resolve(true);
                })
                .catch(() => {
                    // console.log('isBiometricSupported false')
                    resolve(false);
                });
        });
    };

    cleanPinInput = () => {
        requestAnimationFrame(() => {
            if (this.pinInputRef.current) {
                this.pinInputRef.current?.setState({
                    digits: '',
                });    
                this.pinInputRef.current.focus();
            }
        });
    };

    checkPasscode = (passcode: string) => {
        if (isStrong(passcode)) {
            VibrateHapticFeedback('impactLight');
            this.setState({
                passcode,
            });
        } else {
            Prompt(
                Localize.t('setupPasscode.weakPasscode'),
                Localize.t('setupPasscode.weakPasscodeDescription'),
                [
                    {
                        text: Localize.t('setupPasscode.useAnyway'),
                        onPress: () => {
                            VibrateHapticFeedback('impactLight');
                            this.setState(
                                {
                                    passcode,
                                },
                                this.onNext,
                            );
                        },
                        style: 'destructive',
                    },
                    {
                        text: Localize.t('setupPasscode.changePasscode'),
                        onPress: () => {
                            if (this.pinInputRef?.current) {
                                this.cleanPinInput();
                                // this.pinInputRef?.current.focus();
                            }
                        },
                    },
                ],
                { type: 'default' },
            );
        }
    };

    checkPasscodeConfirm = (passcodeConfirm: string) => {
        const { passcode } = this.state;

        // passcode doesn't match the confirmation pin
        if (passcode !== passcodeConfirm) {
            Toast(Localize.t('setupPasscode.passcodeDoNotMatch'));
            VibrateHapticFeedback('notificationError');

            // clean pin code
            if (this.pinInputRef?.current) {
                this.cleanPinInput();
                // this.pinInputRef?.current.focus();
            }

            // go back to entry step
            this.setState({
                passcode: '',
                currentStep: Steps.ENTER_PASSCODE,
            });
            return;
        }

        VibrateHapticFeedback('impactLight');
        this.setState({
            passcodeConfirm,
        });
    };

    onPasscodeEnter = (code: string) => {
        const { currentStep } = this.state;

        switch (currentStep) {
            case Steps.ENTER_PASSCODE:
                this.checkPasscode(code);
                break;
            case Steps.CONFIRM_PASSCODE:
                this.checkPasscodeConfirm(code);
                break;
            default:
                break;
        }
    };

    renderFooter = () => {
        const { currentStep, passcode, passcodeConfirm, isLoading } = this.state;

        if (currentStep === Steps.EXPLANATION) {
            return (
                <Button testID="go-button" onPress={this.onNext} label={Localize.t('global.okLetsGo')} />
            );
        }

        return (
            <Footer style={[AppStyles.row, AppStyles.paddingBottom]}>
                <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                    <Button
                        light
                        isDisabled={isLoading}
                        icon="IconChevronLeft"
                        iconStyle={styles.IconChevronLeft}
                        onPress={this.onBack}
                    />
                </View>

                <View style={AppStyles.flex4}>
                    <Button
                        testID="next-button"
                        isDisabled={
                            currentStep === Steps.ENTER_PASSCODE ? passcode.length < 6 : passcode !== passcodeConfirm
                        }
                        onPress={this.onNext}
                        label={
                            currentStep === Steps.ENTER_PASSCODE ? Localize.t('global.next') : Localize.t('global.save')
                        }
                        isLoading={isLoading}
                    />
                </View>
            </Footer>
        );
    };

    renderContent() {
        const { currentStep, coreSettings } = this.state;

        if (currentStep === Steps.EXPLANATION) {
            return (
                <View testID="pin-code-explanation-view" style={[AppStyles.flex8, AppStyles.paddingSml]}>
                    <View style={[AppStyles.centerAligned]}>
                        <Text style={[AppStyles.h5, AppStyles.strong]}>
                            {Localize.t('setupPasscode.setupAPasscode')}
                        </Text>
                        <Spacer size={20} />
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned, AppStyles.colorSilver]}>
                            {Localize.t('setupPasscode.passCodeDescription')}
                        </Text>
                    </View>
                    <View style={[AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Image style={[styles.instructionImage]} source={Images.Pincode} />
                    </View>
                </View>
            );
        }

        return (
            <View testID="pin-code-entry-view" style={[
                AppStyles.paddingTop,
                AppStyles.marginTop,
                AppStyles.paddingHorizontal,
            ]}>
                <Text style={[
                    AppStyles.p,
                    AppStyles.textCenterAligned,
                    AppStyles.marginBottomSml,
                ]}>
                    {currentStep === Steps.ENTER_PASSCODE
                        ? Localize.t('setupPasscode.setPasscode')
                        : Localize.t('setupPasscode.repeatPasscode')}
                </Text>
                { currentStep === Steps.ENTER_PASSCODE &&
                    <Text style={[
                        AppStyles.smalltext,
                        AppStyles.bold,
                        AppStyles.textCenterAligned,
                        AppStyles.marginTopNegativeSml,
                        AppStyles.colorPrimary,
                    ]}>
                        {Localize.t('setupPasscode.warnNeedPasscode')}
                    </Text>
                }
                {/* <Spacer size={11} /> */}
                <SecurePinInput
                    // autoFocus
                    ref={this.pinInputRef}
                    virtualKeyboard
                    condensed
                    // checkStrength={currentStep === Steps.ENTER_PASSCODE}
                    length={6}
                    pinPadStyle={[
                    ]}
                    supportBiometric={false}
                    enableHapticFeedback={coreSettings.hapticFeedback}
                    onInputFinish={this.onPasscodeEnter}
                />
            </View>
        );
    }

    render() {
        return (
            <ImageBackground
                testID="setup-passcode-screen"
                resizeMode="cover"
                source={StyleService.getImageIfLightModeIfDarkMode('BackgroundPatternLight', 'BackgroundPattern')}
                style={onboardingStyles.backgroundImageStyle}
                imageStyle={onboardingStyles.backgroundImageStyle}
            >
                <SafeAreaView style={[AppStyles.flex2, AppStyles.centerAligned, AppStyles.padding]}>
                    <Image
                        style={onboardingStyles.logo}
                        source={StyleService.getImageIfLightModeIfDarkMode('XamanLogo', 'XamanLogoLight')}
                    />
                </SafeAreaView>
                {this.renderContent()}
                <SafeAreaView style={[
                    AppStyles.flex2,
                    AppStyles.marginTop,
                ]}>
                    <SafeAreaView style={[
                        onboardingStyles.container,
                    ]}>
                        <Footer style={[
                            AppStyles.paddingBottom,
                            AppStyles.paddingTopNone,
                        ]}>
                            {this.renderFooter()}
                        </Footer>
                    </SafeAreaView>
                </SafeAreaView>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default PasscodeSetupView;
