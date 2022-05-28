/**
 * Settings Screen
 */

import React, { Component } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { TouchableDebounce, Header, Icon } from '@components/General';

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

    onRowPress = (route: string) => {
        if (route === 'XUMM.Support.XApp') {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier: 'xumm.support',
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
            );
        } else {
            Navigator.push(route);
        }
    };

    renderRow = (icon: any, label: string, screen: string, testID: string) => {
        return (
            <TouchableDebounce
                testID={testID}
                onPress={() => {
                    this.onRowPress(screen);
                }}
            >
                <View style={[AppStyles.row, styles.rowContainer]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Icon size={25} name={icon} style={styles.rowIcon} />
                    </View>
                    <View style={[AppStyles.flex4, AppStyles.centerContent]}>
                        <Text numberOfLines={1} style={[styles.rowLabel]}>
                            {label}
                        </Text>
                    </View>
                    <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                        <Icon size={25} name="IconChevronRight" style={styles.rowIcon} />
                    </View>
                </View>
            </TouchableDebounce>
        );
    };

    render() {
        return (
            <View testID="settings-tab-screen" style={AppStyles.tabContainer}>
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
                            'IconHelpCircle',
                            Localize.t('setupTermOfService.questionsAndSupport'),
                            'XUMM.Support.XApp',
                            'support-button',
                        )}
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
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SettingsView;
