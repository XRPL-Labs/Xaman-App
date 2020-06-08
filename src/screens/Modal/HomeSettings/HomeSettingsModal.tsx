/**
 * Home Settings Modal
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Image, Text, TouchableOpacity, BackHandler } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { AppScreens } from '@common/constants';

import { Button, Icon } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class HomeSettingsModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.HomeSettings;

    private backHandler: any;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    componentWillUnmount() {
        if (this.backHandler) {
            this.backHandler.remove();
        }
    }

    componentDidMount() {
        this.backHandler = BackHandler.addEventListener('hardwareBackPress', this.onClose);
    }

    onClose = () => {
        Navigator.dismissModal();
        return true;
    };

    onSwitchAccountPress = async () => {
        Navigator.dismissModal();
        Navigator.showOverlay(AppScreens.Overlay.SwitchAccount, {
            layout: {
                backgroundColor: 'transparent',
                componentBackgroundColor: 'transparent',
            },
        });
    };

    onAccountSettingsPress = async () => {
        await Navigator.dismissModal();
        Navigator.push(AppScreens.Account.Edit.Settings);
    };

    render() {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.topContainer}>
                    <View style={[AppStyles.flex1, AppStyles.row]}>
                        <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                            <Image style={[styles.logo]} source={Images.xummLogo} />
                        </View>
                        <View style={[AppStyles.paddingRightSml, AppStyles.rightAligned, AppStyles.centerContent]}>
                            <Button
                                onPress={() => {
                                    Navigator.dismissModal();
                                }}
                                roundedSmall
                                light
                                label={Localize.t('global.close').toUpperCase()}
                                icon="IconX"
                                iconStyle={AppStyles.imgColorBlue}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.bottomContainer}>
                    <View
                        style={[AppStyles.flex1, AppStyles.rightAligned, AppStyles.paddingRight, AppStyles.paddingLeft]}
                    >
                        <TouchableOpacity
                            style={[AppStyles.row, AppStyles.centerAligned]}
                            onPress={this.onAccountSettingsPress}
                        >
                            <Text style={[AppStyles.h5, AppStyles.paddingRightSml, styles.whiteText]}>
                                {Localize.t('account.accountSettings')}
                            </Text>
                            <Icon size={30} style={[styles.iconSettings]} name="IconSettings" />
                        </TouchableOpacity>
                    </View>

                    <View style={[AppStyles.flex1, AppStyles.paddingTop, styles.separator]} />

                    <View
                        style={[
                            AppStyles.flex1,
                            AppStyles.rightAligned,
                            AppStyles.paddingTop,
                            AppStyles.paddingRight,
                            AppStyles.paddingLeft,
                        ]}
                    >
                        <TouchableOpacity
                            onPress={this.onSwitchAccountPress}
                            style={[AppStyles.row, AppStyles.centerAligned]}
                        >
                            <Text style={[AppStyles.h5, AppStyles.paddingRightSml, styles.whiteText]}>
                                {Localize.t('account.switchAddAccount')}
                            </Text>
                            <Icon size={30} style={[styles.iconSettings]} name="IconCornerRightUp" />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default HomeSettingsModal;
