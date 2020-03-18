/**
 * Setup Biometry  Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, Image } from 'react-native';
import TouchID from 'react-native-touch-id';

import { CoreRepository } from '@store/repositories';
import { BiometryType } from '@store/types';
import { Images, Navigator } from '@common/helpers';
import { AppScreens } from '@common/constants';
import { PushNotificationsService } from '@services';
import Localize from '@locale';
import { Button, Spacer, Footer } from '@components';
import { AppStyles } from '@theme';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    passcode: string;
}

export interface State {}

/* Component ==================================================================== */
class BiometrySetupView extends Component<Props, State> {
    static screenName = AppScreens.Setup.Biometric;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    requestAuthenticate = () => {
        const optionalConfigObject = {
            title: Localize.t('global.authenticationRequired'),
            sensorErrorDescription: Localize.t('global.failed'),
            cancelText: Localize.t('global.cancel'),
            fallbackLabel: 'Use Passcode',
            unifiedErrors: false,
            passcodeFallback: false,
        };

        TouchID.authenticate('authenticate to TouchID/FaceID', optionalConfigObject)
            .then(() => {
                TouchID.isSupported().then(biometryType => {
                    if (biometryType === 'FaceID') {
                        CoreRepository.saveSettings({ biometricMethod: BiometryType.FaceID });
                    } else {
                        CoreRepository.saveSettings({ biometricMethod: BiometryType.TouchID });
                    }
                });

                this.nextStep();
            })
            .catch(() => {
                Alert.alert(Localize.t('global.invalidAuth'), Localize.t('global.invalidBiometryAuth'));
            });
    };

    ignoreBiometric = () => {
        CoreRepository.saveSettings({ biometricMethod: BiometryType.None });

        this.nextStep();
    };

    nextStep = () => {
        // if push notification already granted then go to last part
        PushNotificationsService.checkPermission().then(granted => {
            if (granted) {
                Navigator.push(AppScreens.Setup.Finish);
                return;
            }

            Navigator.push(AppScreens.Setup.Permissions);
        });
    };

    render() {
        return (
            <SafeAreaView testID="biometric-setup-view" style={[AppStyles.container]}>
                <View style={[AppStyles.flex2, AppStyles.centerContent]}>
                    <Image style={styles.logo} source={Images.xummLogo} />
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
                        onPress={this.ignoreBiometric}
                    />
                    <Spacer />
                    <Button testID="save-button" label={Localize.t('global.yes')} onPress={this.requestAuthenticate} />
                </Footer>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default BiometrySetupView;
