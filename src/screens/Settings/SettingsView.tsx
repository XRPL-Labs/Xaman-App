/**
 * Settings Screen
 */

import React, { Component } from 'react';
import { SafeAreaView, View, Text, ScrollView, TouchableOpacity } from 'react-native';

import { Navigator } from '@common/helpers';
import { AppScreens } from '@common/constants';

import { Icon } from '@components';

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

    renderRow = (icon: any, label: string, screen: string) => {
        return (
            <TouchableOpacity
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
            <SafeAreaView testID="settings-tab-view" style={[AppStyles.pageContainer]}>
                <View style={[AppStyles.headerContainer]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                        <Text style={AppStyles.h3}>{Localize.t('global.settings')}</Text>
                    </View>
                </View>
                <View style={[AppStyles.contentContainer]}>
                    <ScrollView
                        style={AppStyles.flex1}
                        contentContainerStyle={[AppStyles.paddingRight, AppStyles.paddingLeft]}
                    >
                        {this.renderRow('IconAccount', Localize.t('global.accounts'), AppScreens.Account.List)}
                        <View style={styles.hr} />
                        {this.renderRow('IconSlider', Localize.t('global.general'), AppScreens.Settings.General)}
                        {this.renderRow(
                            'IconBook',
                            Localize.t('global.addressBook'),
                            AppScreens.Settings.AddressBook.List,
                        )}
                        <View style={styles.hr} />
                        {this.renderRow('IconShield', Localize.t('global.security'), AppScreens.Settings.Security)}
                        {this.renderRow('IconActivity', Localize.t('global.advanced'), AppScreens.Settings.Advanced)}
                        <View style={styles.hr} />
                        {this.renderRow(
                            'IconInfo',
                            Localize.t('settings.termsAndConditions'),
                            AppScreens.Settings.TermOfUse,
                        )}
                        {this.renderRow('IconStar', Localize.t('settings.credits'), AppScreens.Settings.Credits)}
                    </ScrollView>
                </View>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default SettingsView;
