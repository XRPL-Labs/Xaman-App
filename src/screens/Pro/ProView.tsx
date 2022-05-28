/**
 * XUMM Pro Screen
 */

import React, { Component } from 'react';
import { View, Text, ImageBackground, Image } from 'react-native';

import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

// constants
import { AppScreens } from '@common/constants';

// components
import { Header, Button, Spacer } from '@components/General';

import StyleService from '@services/StyleService';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import { Navigator } from '@common/helpers/navigator';

import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    paid: boolean;
    isLoading: boolean;
}

/* Component ==================================================================== */
class ProView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Pro;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    openProBeta = () => {
        Navigator.showModal(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: 'xumm.pro-beta',
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
        );
    };

    render() {
        return (
            <View testID="profile-tab-view" style={AppStyles.tabContainer}>
                <Header
                    placement="left"
                    containerStyle={AppStyles.headerContainer}
                    leftComponent={{
                        text: Localize.t('pro.proBeta'),
                        textStyle: AppStyles.h3,
                    }}
                />

                <ImageBackground
                    source={StyleService.getImage('BackgroundShapes')}
                    imageStyle={AppStyles.BackgroundShapes}
                    style={[AppStyles.contentContainer, AppStyles.padding]}
                >
                    <Image style={styles.imageProfilePro} source={StyleService.getImage('ImageProfilePro')} />

                    <Text style={[AppStyles.h5, AppStyles.textCenterAligned]}>{Localize.t('pro.xummProBeta')}</Text>
                    <Spacer />
                    <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                        {Localize.t('pro.xummProBetaDescription')}
                    </Text>
                    <Spacer size={40} />
                    <Button
                        onPress={this.openProBeta}
                        label={Localize.t('pro.openProBeta')}
                        style={styles.openBetaButton}
                        rounded
                    />
                </ImageBackground>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ProView;
