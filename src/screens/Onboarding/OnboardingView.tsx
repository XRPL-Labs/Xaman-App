/**
 * Onboarding Screen
 */

import React, { Component } from 'react';
import { Text, ImageBackground, Image, SafeAreaView, View } from 'react-native';

import StyleService from '@services/StyleService';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Slider, Slide, Spacer } from '@components/General';

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
        return {
            topBar: {
                visible: false,
            },
        };
    }

    onFinish = () => {
        Navigator.push<PasscodeSetupViewProps>(AppScreens.Setup.Passcode, {});
    };

    render() {
        return (
            <ImageBackground
                testID="onboarding-screen"
                source={StyleService.getImage('BackgroundPattern')}
                style={styles.container}
                imageStyle={styles.backgroundImageStyle}
            >
                <SafeAreaView style={[AppStyles.flex1, AppStyles.centerAligned, AppStyles.padding]}>
                    <Image style={styles.logo} source={StyleService.getImage('XamanLogo')} />
                </SafeAreaView>
                <SafeAreaView style={AppStyles.flex8}>
                    <Slider onFinish={this.onFinish}>
                        <Slide>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Text style={[AppStyles.h4, AppStyles.strong]}>
                                    {Localize.t('onboarding.slideOne_title')}
                                </Text>
                            </View>
                        </Slide>
                        <Slide>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Image
                                    style={AppStyles.emptyIcon}
                                    source={StyleService.getImage('ImageManageAccounts')}
                                />
                                <Spacer size={50} />
                                <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideTwo_title')}
                                </Text>
                                <Spacer size={10} />
                                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideTwo_desc')}
                                </Text>
                            </View>
                        </Slide>
                        <Slide>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Image
                                    style={AppStyles.emptyIcon}
                                    source={StyleService.getImage('ImageSecurityFirst')}
                                />
                                <Spacer size={50} />
                                <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideThree_title')}
                                </Text>
                                <Spacer size={10} />
                                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideThree_desc')}
                                </Text>
                            </View>
                        </Slide>
                        <Slide>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Image style={AppStyles.emptyIcon} source={StyleService.getImage('ImageSendReceive')} />
                                <Spacer size={50} />
                                <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideFour_title')}
                                </Text>
                                <Spacer size={10} />
                                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideFour_desc')}
                                </Text>
                            </View>
                        </Slide>
                    </Slider>
                </SafeAreaView>
            </ImageBackground>
        );
    }
}

/* Export Component ==================================================================== */
export default OnboardingView;
