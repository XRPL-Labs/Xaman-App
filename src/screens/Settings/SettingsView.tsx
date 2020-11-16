/**
 * Settings Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { Header, Icon } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';

import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {}

/* Component ==================================================================== */
class SettingsView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Settings;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    onRowPress = (screen: string) => {
        Navigator.push(screen);
    };

    renderRow = (icon: any, label: string, screen: string, testID: string) => {
        return (
            <TouchableOpacity
                testID={testID}
                onPress={() => {
                    this.onRowPress(screen);
                }}
            >
                <View style={[AppStyles.row, styles.rowContainer]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Icon size={25} name={icon} />
                    </View>
                    <View style={[AppStyles.flex3, AppStyles.centerContent]}>
                        <Text style={[styles.rowLabel]}>{label}</Text>
                    </View>
                    <View style={[AppStyles.flex2, AppStyles.rightAligned]}>
                        <Icon size={25} name="IconChevronRight" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    render() {
        return (
            <SafeAreaView testID="settings-tab-screen" style={[AppStyles.tabContainer]}>
                <Header
                    placement="left"
                    containerStyle={AppStyles.headerContainer}
                    leftComponent={{
                        text: Localize.t('global.settings'),
                        textStyle: AppStyles.h3,
                    }}
                />

                <View style={[AppStyles.contentContainer]}>
                    <ScrollView
                        style={AppStyles.flex1}
                        contentContainerStyle={[AppStyles.paddingRight, AppStyles.paddingLeft]}
                    >
                        {this.renderRow(
                            'IconAccount',
                            Localize.t('global.accounts'),
                            AppScreens.Account.List,
                            'accounts-button',
                        )}
                        <View style={styles.hr} />
                        {this.renderRow(
                            'IconSlider',
                            Localize.t('global.general'),
                            AppScreens.Settings.General,
                            'general-button',
                        )}
                        {this.renderRow(
                            'IconBook',
                            Localize.t('global.addressBook'),
                            AppScreens.Settings.AddressBook.List,
                            'address-book-button',
                        )}
                        <View style={styles.hr} />
                        {this.renderRow(
                            'IconShield',
                            Localize.t('global.security'),
                            AppScreens.Settings.Security,
                            'security-button',
                        )}
                        {this.renderRow(
                            'IconActivity',
                            Localize.t('global.advanced'),
                            AppScreens.Settings.Advanced,
                            'advanced-button',
                        )}
                        <View style={styles.hr} />
                        {this.renderRow(
                            'IconInfo',
                            Localize.t('settings.termsAndConditions'),
                            AppScreens.Settings.TermOfUse,
                            'tos-button',
                        )}
                        {this.renderRow(
                            'IconStar',
                            Localize.t('settings.credits'),
                            AppScreens.Settings.Credits,
                            'credits-button',
                        )}
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default SettingsView;
