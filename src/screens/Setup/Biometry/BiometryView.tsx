/**
 * Setup Biometry  Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, Image } from 'react-native';

import { CoreRepository } from '@store/repositories';
import { BiometryType } from '@store/types';

import { Biometric } from '@common/libs/biometric';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

import { PushNotificationsService, StyleService } from '@services';

import { Button, Spacer, Footer } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    passcode: string;
}

export interface State {
    isButtonsDisabled: boolean;
    isSkipButtonLoading: boolean;
    isSaveButtonLoading: boolean;
}

/* Component ==================================================================== */
class BiometrySetupView extends Component<Props, State> {
    static screenName = AppScreens.Setup.Biometric;

    constructor(props: Props) {
        super(props);

        this.state = {
            isButtonsDisabled: false,
            isSkipButtonLoading: false,
            isSaveButtonLoading: false,
        };
    }

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    onYesPress = async () => {
        try {
            // NOTE: this screen is only visible if in prev screen isSensorAvailable method returned biometric type
            // check current biometric type;
            const biometricMethod = await Biometric.isSensorAvailable();

            // request authentication for biometric
            await Biometric.authenticate(Localize.t('global.authenticate'));

            // go to next step
            this.nextStep(biometricMethod);
        } catch {
            Alert.alert(Localize.t('global.invalidAuth'), Localize.t('global.invalidBiometryAuth'));
        }
    };

    onSkipPress = () => {
        // go to next step
        this.nextStep(BiometryType.None);
    };

    nextStep = (biometricMethod: BiometryType) => {
        // save selected biometric method
        // if skipped biometric method will be BiometryType.None
        CoreRepository.saveSettings({ biometricMethod });

        // if firebase is down or user don't have internet connection
        // this process may take a while, we need to show loading indicator

        // disable both buttons
        this.setState({
            isButtonsDisabled: true,
        });

        // set loading base on the skipped or authorized biometrics
        if (biometricMethod === BiometryType.None) {
            this.setState({
                isSkipButtonLoading: true,
            });
        } else {
            this.setState({
                isSaveButtonLoading: true,
            });
        }

        // if push notification already granted then go to last part
        PushNotificationsService.checkPermission()
            .then((granted) => {
                if (granted) {
                    Navigator.push(AppScreens.Setup.Disclaimers);
                    return;
                }

                // show push notification permission screen
                Navigator.push(AppScreens.Setup.PushNotification);
            })
            .finally(() => {
                this.setState({
                    isButtonsDisabled: false,
                    isSkipButtonLoading: false,
                    isSaveButtonLoading: false,
                });
            });
    };

    render() {
        const { isButtonsDisabled, isSkipButtonLoading, isSaveButtonLoading } = this.state;

        return (
            <SafeAreaView testID="biometric-setup-view" style={[AppStyles.container]}>
                <View style={[AppStyles.flex2, AppStyles.centerContent]}>
                    <Image style={styles.logo} source={StyleService.getImage('XamanLogo')} />
                </View>

                <View style={[AppStyles.flex8, AppStyles.paddingSml]}>
                    <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.centerContent]}>
                        <Image style={[AppStyles.emptyIcon]} source={Images.ImageBiometric} />
                    </View>

                    <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.flexEnd]}>
                        <Text style={[AppStyles.h5, AppStyles.strong]}>{Localize.t('setupBiometry.useBiometry')}</Text>
                        <Spacer size={10} />
                        <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                            {Localize.t('setupBiometry.biometryDescription')}
                        </Text>
                    </View>
                </View>

                <Footer style={[AppStyles.paddingBottom]}>
                    <Button
                        light
                        testID="skip-button"
                        label={Localize.t('global.maybeLater')}
                        onPress={this.onSkipPress}
                        isDisabled={isButtonsDisabled && !isSkipButtonLoading}
                        isLoading={isSkipButtonLoading}
                    />
                    <Spacer />
                    <Button
                        testID="yes-button"
                        label={Localize.t('global.yes')}
                        onPress={this.onYesPress}
                        isDisabled={isButtonsDisabled}
                        isLoading={isSaveButtonLoading}
                    />
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default BiometrySetupView;
