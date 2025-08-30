/**
 * Onboarding Screen
 */

import React, { Component } from 'react';
import { Text, ImageBackground, Image, SafeAreaView, View } from 'react-native';

import StyleService from '@services/StyleService';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';
import { Footer, Button } from '@components/General';

import Localize from '@locale';

import { PasscodeSetupViewProps } from '@screens/Setup/Passcode';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}
export interface State {}

/* Component ==================================================================== */
class OnboardingView extends Component<Props, State> {
    static screenName = AppScreens.Onboarding;

    static options() {
        return { topBar: { visible: false } };
    }

    onFinish = () => {
        Navigator.push<PasscodeSetupViewProps>(AppScreens.Setup.Passcode, {});
    };

    render() {
        return (
            <ImageBackground
                testID="onboarding-screen"
                resizeMode="cover"
                source={StyleService.getImageIfLightModeIfDarkMode('BackgroundPatternLight', 'BackgroundPattern')}
                style={styles.backgroundImageStyle}
                imageStyle={styles.backgroundImageStyle}
            >
                <SafeAreaView style={[AppStyles.flex3, AppStyles.centerAligned, AppStyles.padding]}>
                    <Image
                        style={styles.logo}
                        source={StyleService.getImageIfLightModeIfDarkMode('XamanLogo', 'XamanLogoLight')}
                    />
                    <View style={[AppStyles.flex1, AppStyles.centerAligned, AppStyles.paddingHorizontal]}>
                        <Text style={[
                            AppStyles.h4,
                            AppStyles.textCenterAligned,
                            AppStyles.strong,
                            AppStyles.marginHorizontal,
                            AppStyles.marginBottomSml,
                        ]}>
                            {Localize.t('onboarding.v2main1')}
                        </Text>
                        <Text style={[
                            AppStyles.p,
                            AppStyles.textCenterAligned,
                            AppStyles.marginHorizontal,
                            AppStyles.marginTopNegativeSml,
                            AppStyles.colorSilver,
                        ]}>
                            {Localize.t('onboarding.v2main2')}
                        </Text>
                    </View>
                </SafeAreaView>
                <SafeAreaView style={[
                    AppStyles.flex4,
                    AppStyles.marginTop,
                ]}>
                    <SafeAreaView style={[
                        styles.container,
                    ]}>
                        <ImageBackground
                            resizeMode="contain"
                            source={StyleService.getImageIfLightModeIfDarkMode('PhonesLight', 'PhonesDark')}
                            style={[
                                styles.container,
                            ]}
                        />
                        <Footer style={[
                            AppStyles.paddingBottom,
                            AppStyles.paddingTopNone,
                        ]}>
                            <Button
                                testID="start-button"
                                onPress={this.onFinish}
                                label={Localize.t('global.start')}
                            />
                        </Footer>
                    </SafeAreaView>
                </SafeAreaView>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default OnboardingView;
