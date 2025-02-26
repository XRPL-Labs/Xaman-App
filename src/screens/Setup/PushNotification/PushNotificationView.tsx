/**
 * Push Notification Setup Screen
 */

import React, { Component } from 'react';

import { View, Text, Image, SafeAreaView, Alert, ImageBackground } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';
import { Images } from '@common/helpers/images';

import { PushNotificationsService, StyleService } from '@services';

import { Footer, Button, Spacer } from '@components/General';

import Localize from '@locale';

import { FinishSetupViewProps } from '@screens/Setup/Finish';

import { AppStyles } from '@theme';
import styles from './styles';
import onboardingStyles from '../../Onboarding/styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isLoading: boolean;
}

/* Component ==================================================================== */
class PushNotificationSetupView extends Component<Props, State> {
    static screenName = AppScreens.Setup.PushNotification;

    constructor(props: Props) {
        super(props);

        this.state = { isLoading: false };
    }

    static options() {
        return { topBar: { visible: false } };
    }

    requestPermission = () => {
        this.setState({
            isLoading: true,
        });

        PushNotificationsService.requestPermission()
            .then((granted) => {
                if (granted) {
                    this.nextStep();
                    return;
                }

                Alert.alert(
                    Localize.t('global.error'),
                    Localize.t('setupPermissions.pushRegisterError'),
                    [
                        {
                            text: Localize.t('setupPermissions.continueSetup'),
                            onPress: this.nextStep,
                            isPreferred: true,
                        },
                        { text: Localize.t('global.cancel') },
                    ],
                    { cancelable: true },
                );
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    nextStep = () => {
        Navigator.push<FinishSetupViewProps>(AppScreens.Setup.Finish, {});
    };

    render() {
        const { isLoading } = this.state;

        return (
            <ImageBackground
                testID="permission-setup-view"
                resizeMode="cover"
                source={StyleService.getImageIfLightModeIfDarkMode('BackgroundPatternLight', 'BackgroundPattern')}
                style={onboardingStyles.container}
                imageStyle={onboardingStyles.backgroundImageStyle}
            >
                <SafeAreaView style={[AppStyles.flex1, AppStyles.centerAligned, AppStyles.padding]}>
                    <Image
                        style={onboardingStyles.logo}
                        source={StyleService.getImageIfLightModeIfDarkMode('XamanLogo', 'XamanLogoLight')}
                    />
                </SafeAreaView>
                <View style={[
                    AppStyles.flex5,
                ]}>
                    <View style={[AppStyles.flex8, AppStyles.paddingSml]}>
                        <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.flexEnd]}>
                            <Text style={[AppStyles.h5, AppStyles.strong]}>
                                {Localize.t('setupPermissions.enableNotifications')}
                            </Text>
                            <Spacer size={10} />
                            <Text style={[AppStyles.p, AppStyles.textCenterAligned, AppStyles.colorSilver]}>
                                {Localize.t('setupPermissions.permissionDescription')}
                            </Text>
                            <View style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.centerContent]}>
                                <Image style={[styles.notificationImage]} source={Images.Notification} />
                            </View>
                        </View>
                    </View>
                </View>
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
                            <Button numberOfLines={1}
                                light
                                label={Localize.t('global.maybeLater')}
                                onPress={this.nextStep}
                            />
                            <Spacer />
                            <Button
                                isLoading={isLoading}
                                numberOfLines={1}
                                label={Localize.t('global.yes')}
                                onPress={this.requestPermission}
                            />
                        </Footer>
                    </SafeAreaView>
                </SafeAreaView>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default PushNotificationSetupView;
