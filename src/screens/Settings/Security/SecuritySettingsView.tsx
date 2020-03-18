/**
 * Security Settings Screen
 */
import { find } from 'lodash';
import React, { Component } from 'react';
import { Text, ScrollView, View, TouchableOpacity, Alert } from 'react-native';
import TouchID from 'react-native-touch-id';

import { AppScreens } from '@common/constants';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';
import { BiometryType } from '@store/types';

import { Navigator } from '@common/helpers';

import { Header, Switch, Icon } from '@components';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    biometricEnabled: boolean;
    coreSettings: CoreSchema;
}

const TIME_ITEMS = [
    { value: 0, title: `0 ${Localize.t('global.seconds')}` },
    { value: 1, title: `1 ${Localize.t('global.minutes')}` },
    { value: 5, title: `5 ${Localize.t('global.minutes')}` },
    { value: 10, title: `10 ${Localize.t('global.minutes')}` },
    { value: 15, title: `15 ${Localize.t('global.minutes')}` },
    { value: 30, title: `30 ${Localize.t('global.minutes')}` },
    { value: 60, title: `1 ${Localize.t('global.hour')}` },
    { value: 240, title: `4 ${Localize.t('global.hours')}` },
    { value: 480, title: `8 ${Localize.t('global.hours')}` },
    { value: 1440, title: `1 ${Localize.t('global.day')}` },
    { value: 10080, title: `1 ${Localize.t('global.week')}` },
];

/* Component ==================================================================== */
class SecuritySettingsView extends Component<Props, State> {
    static screenName = AppScreens.Settings.Security;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = { coreSettings, biometricEnabled: coreSettings.biometricMethod !== BiometryType.None };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({ coreSettings });
    };

    changeBiometricMethod = (value: boolean) => {
        if (value) {
            const optionalConfigObject = {
                title: Localize.t('global.authenticationRequired'),
                sensorErrorDescription: Localize.t('global.failed'),
                cancelText: Localize.t('global.cancel'),
                fallbackLabel: 'Use Passcode',
                unifiedErrors: false,
                passcodeFallback: true,
            };

            TouchID.authenticate('authenticate to TouchID/FaceID', optionalConfigObject)
                .then(() => {
                    TouchID.isSupported().then(biometryType => {
                        if (biometryType === 'FaceID') {
                            CoreRepository.saveSettings({ biometricMethod: BiometryType.FaceID });
                        } else {
                            CoreRepository.saveSettings({ biometricMethod: BiometryType.TouchID });
                        }
                    });

                    this.setState({
                        biometricEnabled: true,
                    });
                })
                .catch(() => {
                    Alert.alert(Localize.t('global.invalidAuth'), Localize.t('global.invalidBiometryAuth'));
                });
        } else {
            CoreRepository.saveSettings({ biometricMethod: BiometryType.None });

            this.setState({
                biometricEnabled: false,
            });
        }
    };

    biometricMethodChange = (value: boolean) => {
        // if disable the biometric ask for passcode
        if (!value) {
            Navigator.showOverlay(
                AppScreens.Overlay.Auth,
                {
                    overlay: {
                        handleKeyboardEvents: true,
                    },
                    layout: {
                        backgroundColor: 'transparent',
                        componentBackgroundColor: 'transparent',
                    },
                },
                {
                    biometricAvailable: false,
                    onDismissed: ({ success }: { success: boolean }) => {
                        if (success) {
                            this.changeBiometricMethod(value);
                        }
                    },
                },
            );
        } else {
            this.changeBiometricMethod(value);
        }
    };

    onLogoutTimeSelected = (item: any) => {
        CoreRepository.saveSettings({
            minutesAutoLock: item.value,
        });
    };

    showLogoutTimePicker = () => {
        const { coreSettings } = this.state;

        Navigator.push(
            AppScreens.Modal.Picker,
            {},
            {
                title: Localize.t('global.autoLock'),
                description: Localize.t('settings.autoLockAfter'),
                items: TIME_ITEMS,
                selected: coreSettings.minutesAutoLock,
                onSelect: this.onLogoutTimeSelected,
            },
        );
    };

    render() {
        const { biometricEnabled, coreSettings } = this.state;

        return (
            <View testID="security-settings-view" style={[styles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('settings.securitySetting') }}
                />

                <ScrollView>
                    <Text style={styles.descriptionText}>{Localize.t('settings.securitySettingsDescription')}</Text>
                    <TouchableOpacity
                        style={styles.row}
                        onPress={() => {
                            Navigator.push(AppScreens.Settings.ChangePasscode, {
                                animations: {
                                    push: {
                                        enabled: false,
                                    },
                                },
                            });
                        }}
                    >
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('settings.changePasscode')}</Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.row]} onPress={this.showLogoutTimePicker}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('global.autoLock')}</Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={[styles.value]}>
                                {find(TIME_ITEMS, { value: coreSettings.minutesAutoLock }).title}
                            </Text>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('settings.biometricAuthentication')}</Text>
                        </View>
                        <View style={[AppStyles.centerAligned, AppStyles.flex1, AppStyles.row]}>
                            <Switch checked={biometricEnabled} onChange={this.biometricMethodChange} />
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SecuritySettingsView;
