/**
 * Profile Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ImageBackground, Image, Alert } from 'react-native';

// constants
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer } from '@components/General';
import { Images } from '@common/helpers/images';

import IAP from '@common/libs/iap';

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

    constructor(props: Props) {
        super(props);

        this.state = {
            paid: false,
            isLoading: false,
        };
    }

    onSuccessPurchase = () => {
        this.setState({
            isLoading: false,
            paid: true,
        });
    };

    purchase = async () => {
        try {
            this.setState({
                isLoading: true,
            });

            const status = await IAP.status();

            if (status === IAP.SUCCESS_PURCHASE_CODE) {
                this.onSuccessPurchase();
            } else if (status === IAP.ERRORS.E_NO_PURCHASE_HISTORY) {
                await IAP.purchase().then((purchaseResult) => {
                    if (purchaseResult === IAP.SUCCESS_PURCHASE_CODE) {
                        this.onSuccessPurchase();
                        return;
                    }
                    Alert.alert('ERROR', purchaseResult);
                });
            } else {
                Alert.alert('ERROR', status);
            }
        } finally {
            this.setState({
                isLoading: false,
            });
        }
    };

    render() {
        const { paid, isLoading } = this.state;

        return (
            <SafeAreaView testID="profile-tab-view" style={[AppStyles.tabContainer]}>
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
                            {paid ? (
                                <>
                                    <Image style={[AppStyles.emptyIcon]} source={Images.ImageComplete} />
                                    <Text>Your payment was successfull, thanks for supporting XRPL Labs</Text>
                                </>
                            ) : (
                                <>
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
                                        isLoading={isLoading}
                                        onPress={this.purchase}
                                        label="Purchase"
                                        icon="IconPlus"
                                        iconStyle={[AppStyles.imgColorWhite]}
                                        style={{ backgroundColor: AppColors.red }}
                                        rounded
                                    />
                                </>
                            )}
                        </ImageBackground>
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default ProfileView;
