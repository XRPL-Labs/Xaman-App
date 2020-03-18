/**
 * Onboarding Screen
 */

import React, { Component } from 'react';
import { Text, ImageBackground, Image, SafeAreaView, View } from 'react-native';

import { Images, Navigator } from '@common/helpers';

// constants
import { AppScreens } from '@common/constants';
// locale
import Localize from '@locale';

// component
import { Slider, Slide, Spacer } from '@components';

// style
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
        Navigator.push(AppScreens.Setup.Passcode);
    };

    render() {
        return (
            <ImageBackground
                testID="onboarding-view"
                source={Images.backgroundPattern}
                style={[styles.container]}
                imageStyle={styles.backgroundImageStyle}
            >
                <SafeAreaView style={[AppStyles.flex1, AppStyles.centerAligned, AppStyles.padding]}>
                    <Image style={styles.logo} source={Images.xummLogo} />
                </SafeAreaView>
                <SafeAreaView style={[AppStyles.flex8]}>
                    <Slider onFinish={this.onFinish}>
                        <Slide>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Text style={[AppStyles.h4, AppStyles.strong]}>
                                    {Localize.t('onboarding.slideOne.title')}
                                </Text>
                            </View>
                        </Slide>
                        <Slide>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Image style={[AppStyles.emptyIcon]} source={Images.ImageManageAccounts} />
                                <Spacer size={50} />
                                <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideTwo.title')}
                                </Text>
                                <Spacer size={10} />
                                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideTwo.desc')}
                                </Text>
                            </View>
                        </Slide>
                        <Slide>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Image style={[AppStyles.emptyIcon]} source={Images.ImageSecurityFirst} />
                                <Spacer size={50} />
                                <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideThree.title')}
                                </Text>
                                <Spacer size={10} />
                                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideThree.desc')}
                                </Text>
                            </View>
                        </Slide>
                        <Slide>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Image style={[AppStyles.emptyIcon]} source={Images.ImageSendReceive} />
                                <Spacer size={50} />
                                <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideFour.title')}
                                </Text>
                                <Spacer size={10} />
                                <Text style={[AppStyles.p, AppStyles.textCenterAligned]}>
                                    {Localize.t('onboarding.slideFour.desc')}
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
