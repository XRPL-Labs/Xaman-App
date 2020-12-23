/**
 * Setup Biometry  Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, Alert, Image } from 'react-native';

import FingerprintScanner from 'react-native-fingerprint-scanner';

import { CoreRepository } from '@store/repositories';
import { BiometryType } from '@store/types';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';
import { PushNotificationsService } from '@services';
import Localize from '@locale';
import { Button, Spacer, Footer } from '@components/General';
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
        FingerprintScanner.isSensorAvailable()
            .then((biometryType) => {
                FingerprintScanner.authenticate({
                    description: Localize.t('global.authenticate'),
                    fallbackEnabled: false,
                })
                    .then(() => {
                        let type;

                        switch (biometryType) {
                            case 'Face ID':
                                type = BiometryType.FaceID;
                                break;
                            case 'Touch ID':
                                type = BiometryType.TouchID;
                                break;
                            case 'Biometrics':
                                type = BiometryType.Biometrics;
                                break;

                            default:
                                type = BiometryType.None;
                        }

                        CoreRepository.saveSettings({ biometricMethod: type });

                        this.nextStep();
                    })
                    .catch(() => {
                        Alert.alert(Localize.t('global.invalidAuth'), Localize.t('global.invalidBiometryAuth'));
                    })
                    .finally(() => {
                        FingerprintScanner.release();
                    });
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
        PushNotificationsService.checkPermission().then((granted) => {
            if (granted) {
                Navigator.push(AppScreens.Setup.Disclaimers);
                return;
            }

            Navigator.push(AppScreens.Setup.PushNotification);
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
