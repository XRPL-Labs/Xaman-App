/**
 * Profile Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ImageBackground, Image } from 'react-native';

// constants
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer } from '@components';
import { Images } from '@common/helpers';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class ProfileView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Profile;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    render() {
        return (
            <SafeAreaView testID="profile-tab-view" style={[AppStyles.pageContainer]}>
                <View style={[AppStyles.headerContainer]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                        <Text style={AppStyles.h3}>{Localize.t('global.profile')}</Text>
                    </View>
                </View>

                <View style={[AppStyles.contentContainer, AppStyles.padding]}>
                    <View style={[AppStyles.flex4, AppStyles.centerAligned, AppStyles.centerContent]}>
                        <ImageBackground
                            source={Images.BackgroundShapes}
                            imageStyle={AppStyles.BackgroundShapes}
                            style={[AppStyles.BackgroundShapesWH, AppStyles.centerContent]}
                        >
                            <Image style={[AppStyles.emptyIcon]} source={Images.ImageProfile} />
                            <Text style={[AppStyles.emptyText]}>{Localize.t('profile.availableInFuture')}</Text>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.textCenterAligned]}>
                                {Localize.t('profile.profileBenefits')}
                            </Text>
                            <Spacer size={10} />
                            <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                                {Localize.t('profile.personalPage')}
                            </Text>
                            <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                                {Localize.t('profile.connectMobile')}
                            </Text>
                            <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                                {Localize.t('profile.earnBadge')}
                            </Text>
                            <Spacer size={30} />
                            <Button
                                activeOpacity={1}
                                label={Localize.t('global.comingSoon')}
                                icon="IconProfile"
                                iconStyle={[AppStyles.imgColorWhite]}
                                style={{ backgroundColor: AppColors.red }}
                                rounded
                            />
                        </ImageBackground>
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ProfileView;
