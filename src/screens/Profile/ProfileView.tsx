/**
 * Profile Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ImageBackground, Image } from 'react-native';

// constants
import { AppScreens } from '@common/constants';

// components
import { Header, Button, Spacer } from '@components/General';

import StyleService from '@services/StyleService';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';

/* types ==================================================================== */
export interface Props {}

export interface State {
    paid: boolean;
    isLoading: boolean;
}

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

    // constructor(props: Props) {
    //     super(props);

    //     this.state = {
    //         paid: false,
    //         isLoading: false,
    //     };
    // }

    // this is a sample to add in app purchase
    // onSuccessPurchase = () => {
    //     this.setState({
    //         isLoading: false,
    //         paid: true,
    //     });
    // };

    // this is a sample to add in app purchase
    // purchase = async () => {
    //     try {
    //         this.setState({
    //             isLoading: true,
    //         });

    //         const status = await IAP.status();

    //         if (status === IAP.SUCCESS_PURCHASE_CODE) {
    //             this.onSuccessPurchase();
    //         } else if (status === IAP.ERRORS.E_NO_PURCHASE_HISTORY) {
    //             await IAP.purchase().then((purchaseResult) => {
    //                 if (purchaseResult === IAP.SUCCESS_PURCHASE_CODE) {
    //                     this.onSuccessPurchase();
    //                     return;
    //                 }
    //                 Alert.alert('ERROR', purchaseResult);
    //             });
    //         } else {
    //             Alert.alert('ERROR', status);
    //         }
    //     } finally {
    //         this.setState({
    //             isLoading: false,
    //         });
    //     }
    // };

    render() {
        return (
            <SafeAreaView testID="profile-tab-view" style={[AppStyles.tabContainer]}>
                <Header
                    placement="left"
                    containerStyle={AppStyles.headerContainer}
                    leftComponent={{
                        text: Localize.t('global.profile'),
                        textStyle: AppStyles.h3,
                    }}
                />

                <View style={[AppStyles.contentContainer, AppStyles.padding]}>
                    <View style={[AppStyles.flex4, AppStyles.centerAligned, AppStyles.centerContent]}>
                        <ImageBackground
                            source={StyleService.getImage('BackgroundShapes')}
                            imageStyle={AppStyles.BackgroundShapes}
                            style={[AppStyles.BackgroundShapesWH, AppStyles.centerContent]}
                        >
                            <Image style={[AppStyles.emptyIcon]} source={StyleService.getImage('ImageProfile')} />
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
