/**
 * Advanced Settings Screen
 */

import React, { Component } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';

import { PushNotificationsService, ApiService } from '@services';

import { CoreRepository, ProfileRepository } from '@store/repositories';
import { CoreSchema, ProfileSchema } from '@store/schemas/latest';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import { GetAppVersionCode, GetAppReadableVersion } from '@common/helpers/app';

import { TouchableDebounce, Header, Icon, Switch } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    coreSettings: CoreSchema;
    profile: ProfileSchema;
}

/* Component ==================================================================== */
class AdvancedSettingsView extends Component<Props, State> {
    static screenName = AppScreens.Settings.Advanced;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            profile: ProfileRepository.getProfile(),
        };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({
            coreSettings,
        });
    };

    showChangeLog = () => {
        const currentVersionCode = GetAppVersionCode();

        Navigator.showOverlay(AppScreens.Overlay.ChangeLog, { version: currentVersionCode });
    };

    reRegisterPushToken = async () => {
        try {
            // get current permission status
            let hasPermission = await PushNotificationsService.checkPermission();

            if (!hasPermission) {
                // try to request the permission again
                hasPermission = await PushNotificationsService.requestPermission();
            }

            // if still no permission granted, user need to give the permission manually
            if (!hasPermission) {
                Alert.alert(Localize.t('global.error'), Localize.t('global.pushErrorPermissionMessage'));
                return;
            }

            // fetch the push token and send to backend
            const devicePushToken = await PushNotificationsService.getToken();

            ApiService.updateDevice
                .post(null, {
                    devicePushToken,
                })
                .then(() => {
                    Alert.alert(
                        Localize.t('global.success'),
                        Localize.t('settings.successfullyReRegisteredForPushNotifications'),
                    );
                })
                .catch(() => {
                    Alert.alert(
                        Localize.t('global.error'),
                        Localize.t('settings.unableToReRegisteredForPushNotifications'),
                    );
                });
        } catch {
            Alert.alert(Localize.t('global.error'), Localize.t('settings.unableToReRegisteredForPushNotifications'));
        }
    };

    developerModeChange = (value: boolean) => {
        // save in store
        CoreRepository.saveSettings({ developerMode: value });
    };

    render() {
        const { coreSettings, profile } = this.state;

        return (
            <View testID="advanced-settings-screen" style={styles.container}>
                <Header
                    leftComponent={{
                        testID: 'back-button',
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('global.advanced') }}
                />

                <ScrollView>
                    {/* node & explorer section */}
                    <Text numberOfLines={1} style={styles.descriptionText}>
                        {Localize.t('global.networks')}
                    </Text>
                    <TouchableDebounce
                        testID="change-network-button"
                        style={styles.row}
                        onPress={() => {
                            Navigator.push(AppScreens.Settings.Network.List);
                        }}
                    >
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.network')}
                            </Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text numberOfLines={1} style={styles.value}>
                                {coreSettings.network.name}
                            </Text>
                            <Icon size={25} style={styles.rowIcon} name="IconChevronRight" />
                        </View>
                    </TouchableDebounce>

                    {/* push notification section */}
                    <Text numberOfLines={1} style={styles.descriptionText}>
                        {Localize.t('settings.pushNotifications')}
                    </Text>
                    <TouchableDebounce style={styles.row} onPress={this.reRegisterPushToken}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.reRegisterForPushNotifications')}
                            </Text>
                        </View>
                    </TouchableDebounce>

                    {/* release information section */}
                    <Text numberOfLines={1} style={styles.descriptionText}>
                        {Localize.t('settings.releaseInformation')}
                    </Text>
                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.version')}
                            </Text>
                        </View>

                        <TouchableDebounce
                            style={[AppStyles.centerAligned, AppStyles.row]}
                            onPress={this.showChangeLog}
                        >
                            <Text selectable style={styles.value}>
                                {GetAppReadableVersion()}
                            </Text>
                        </TouchableDebounce>
                    </View>
                    <TouchableDebounce style={[styles.row]} onPress={this.showChangeLog}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.viewChangeLog')}
                            </Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Icon size={25} style={styles.rowIcon} name="IconChevronRight" />
                        </View>
                    </TouchableDebounce>

                    {/* debug section */}
                    <Text numberOfLines={1} style={styles.descriptionText}>
                        {Localize.t('global.debug')}
                    </Text>

                    <View style={styles.row}>
                        <View style={AppStyles.flex1}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.deviceUUID')}
                            </Text>
                        </View>

                        <View style={AppStyles.flex2}>
                            <Text selectable numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
                                {profile.deviceUUID.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.developerMode')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={coreSettings.developerMode} onChange={this.developerModeChange} />
                        </View>
                    </View>
                    <TouchableDebounce
                        style={styles.row}
                        onPress={() => {
                            Navigator.push(AppScreens.Settings.SessionLog);
                        }}
                    >
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.sessionLog')}
                            </Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Icon size={25} style={styles.rowIcon} name="IconChevronRight" />
                        </View>
                    </TouchableDebounce>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AdvancedSettingsView;
