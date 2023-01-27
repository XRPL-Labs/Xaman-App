/* eslint-disable react/jsx-no-bind */

/**
 * Edit Third Party app permission Screen
 */
import moment from 'moment-timezone';
import React, { Component } from 'react';
import { View, Text, Alert, ScrollView, Linking } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { Navigator } from '@common/helpers/navigator';
import { Prompt } from '@common/helpers/interface';
import { StringTypeCheck } from '@common/utils/string';

import { AppScreens } from '@common/constants';

import BackendService from '@services/BackendService';

import { Icon, Avatar, Button, Header, Spacer, TouchableDebounce } from '@components/General';

import Localize from '@locale';

import { ThirdPartyAppType } from '@screens/Settings/ThirdPartyApps/ThirdPartyAppsView';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    thirdPartyApp: ThirdPartyAppType;
}

export interface State {
    isRevokingAccess: boolean;
}

/* Component ==================================================================== */
class EditThirdPartyAppView extends Component<Props, State> {
    static screenName = AppScreens.Settings.ThirdPartyApps.Edit;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isRevokingAccess: false,
        };
    }

    revokeAccess = async () => {
        const { thirdPartyApp } = this.props;
        const { app, report } = thirdPartyApp;

        this.setState({
            isRevokingAccess: true,
        });

        // remove third party app permission
        BackendService.revokeThirdPartyPermission(app.id)
            .then(async () => {
                // close screen
                await Navigator.pop();

                if (report) {
                    Navigator.showModal(
                        AppScreens.Modal.XAppBrowser,
                        {
                            identifier: report,
                        },
                        {
                            modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                            modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                        },
                    );
                }
            })
            .catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('settings.unableToRevokeAppAccess'));
            })
            .finally(() => {
                this.setState({
                    isRevokingAccess: false,
                });
            });
    };

    onRevokeAccessPress = () => {
        const { thirdPartyApp } = this.props;

        const { app } = thirdPartyApp;

        Prompt(
            Localize.t('global.warning'),
            Localize.t('settings.areYouSureYouWantRevokeAccess', { appName: app.name }),
            [
                {
                    text: Localize.t('global.cancel'),
                },
                {
                    text: Localize.t('global.doIt'),
                    style: 'destructive',
                    onPress: this.revokeAccess,
                },
            ],
            { type: 'default' },
        );
    };

    onExternalLinkPress = (url: string) => {
        if (StringTypeCheck.isValidURL(url)) {
            Linking.openURL(url).catch(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('global.unableToOpenUrl'));
            });
        }
    };

    renderDeveloperInformation = () => {
        const { thirdPartyApp } = this.props;

        const { urls } = thirdPartyApp;

        // nothing to show
        if (!urls || (!urls.homepage && !urls.privacy && !urls.support && !urls.terms)) {
            return null;
        }

        return (
            <>
                <View style={styles.separatorContainer}>
                    <Text style={AppStyles.pbold}>{Localize.t('settings.developerInformation')}</Text>
                </View>

                <View style={AppStyles.paddingHorizontalSml}>
                    {urls.homepage && (
                        <TouchableDebounce
                            onPress={this.onExternalLinkPress.bind(null, urls.homepage)}
                            style={styles.infoRow}
                        >
                            <Text style={[AppStyles.subtext, AppStyles.link]}>{Localize.t('global.website')}</Text>
                        </TouchableDebounce>
                    )}
                    {urls.support && (
                        <TouchableDebounce
                            onPress={this.onExternalLinkPress.bind(null, urls.support)}
                            style={styles.infoRow}
                        >
                            <Text style={[AppStyles.subtext, AppStyles.link]}>{Localize.t('global.support')}</Text>
                        </TouchableDebounce>
                    )}
                    {urls.privacy && (
                        <TouchableDebounce
                            onPress={this.onExternalLinkPress.bind(null, urls.privacy)}
                            style={styles.infoRow}
                        >
                            <Text style={[AppStyles.subtext, AppStyles.link]}>
                                {Localize.t('global.privacyPolicy')}
                            </Text>
                        </TouchableDebounce>
                    )}
                    {urls.terms && (
                        <TouchableDebounce
                            onPress={this.onExternalLinkPress.bind(null, urls.terms)}
                            style={styles.infoRow}
                        >
                            <Text style={[AppStyles.subtext, AppStyles.link]}>
                                {Localize.t('global.termsAndConditions')}
                            </Text>
                        </TouchableDebounce>
                    )}
                </View>
            </>
        );
    };

    renderGrants = () => {
        return (
            <>
                <View style={styles.separatorContainer}>
                    <Text style={AppStyles.pbold}>{Localize.t('global.grants')}</Text>
                </View>

                <View style={AppStyles.paddingHorizontalSml}>
                    <View style={styles.infoRow}>
                        <Icon name="IconCheck" style={styles.checkIcon} />
                        <Text style={AppStyles.subtext}>{Localize.t('settings.seeAddress')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Icon name="IconCheck" style={styles.checkIcon} />
                        <Text style={AppStyles.subtext}>{Localize.t('settings.sendPushNotifications')}</Text>
                    </View>
                </View>
            </>
        );
    };

    renderPermissions = () => {
        const { thirdPartyApp } = this.props;

        const { grant } = thirdPartyApp;

        return (
            <>
                <View style={styles.separatorContainer}>
                    <Text style={AppStyles.pbold}>{Localize.t('global.permission')}</Text>
                </View>

                <View style={[AppStyles.centerAligned, AppStyles.paddingHorizontalSml]}>
                    <View style={styles.infoRow}>
                        <View style={AppStyles.flex1}>
                            <Text style={AppStyles.subtext}>{Localize.t('settings.accessExpires')}:</Text>
                        </View>
                        <View style={AppStyles.flex1}>
                            <Text style={[AppStyles.subtext, AppStyles.textRightAligned]}>
                                {moment(grant.expires).format('YYYY-MM-DD HH:mm')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={AppStyles.flex1}>
                            <Text style={AppStyles.subtext}>{Localize.t('settings.accessDuration')}:</Text>
                        </View>
                        <View style={AppStyles.flex1}>
                            <Text style={[AppStyles.subtext, AppStyles.textRightAligned]}>
                                {grant.validity} {Localize.t('global.days')}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <View style={AppStyles.flex1}>
                            <Text style={AppStyles.subtext}>{Localize.t('settings.accessGranted')}:</Text>
                        </View>
                        <View style={AppStyles.flex1}>
                            <Text style={[AppStyles.subtext, AppStyles.textRightAligned]}>
                                {moment(grant.issued).format('YYYY-MM-DD HH:mm')}
                            </Text>
                        </View>
                    </View>
                </View>
            </>
        );
    };

    renderDetails = () => {
        const { thirdPartyApp } = this.props;

        const { app } = thirdPartyApp;

        return (
            <View style={[AppStyles.centerAligned, AppStyles.paddingSml]}>
                <Avatar size={70} source={{ uri: app.icon }} />
                <Spacer />
                <Text style={AppStyles.pbold}>{Localize.t('global.details')}:</Text>
                <Spacer />
                <Text style={[AppStyles.baseText, AppStyles.mono, AppStyles.textCenterAligned]}>{app.description}</Text>
            </View>
        );
    };

    renderFooter = () => {
        const { isRevokingAccess } = this.state;

        return (
            <Button
                numberOfLines={1}
                isLoading={isRevokingAccess}
                label={Localize.t('settings.revokeAccess')}
                style={styles.revokeAccessButton}
                onPress={this.onRevokeAccessPress}
            />
        );
    };

    render() {
        const { thirdPartyApp } = this.props;

        const { app } = thirdPartyApp;

        return (
            <View testID="edit-third-party-app" style={AppStyles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: app.name }}
                />
                <ScrollView style={[AppStyles.flex1, AppStyles.stretchSelf]}>
                    {this.renderDetails()}
                    {this.renderPermissions()}
                    {this.renderGrants()}
                    {this.renderDeveloperInformation()}
                    {this.renderFooter()}
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default EditThirdPartyAppView;
