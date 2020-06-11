/**
 * Security Settings Screen
 */
import { find } from 'lodash';
import React, { Component } from 'react';
import { Text, ScrollView, View, TouchableOpacity, Alert } from 'react-native';

import FingerprintScanner from 'react-native-fingerprint-scanner';

import { AppScreens } from '@common/constants';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';
import { BiometryType } from '@store/types';

import { Navigator } from '@common/helpers/navigator';

import { Header, Switch, Icon } from '@components/General';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    biometricEnabled: boolean;
    isSensorAvailable: boolean;
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

        this.state = {
            coreSettings,
            isSensorAvailable: false,
            biometricEnabled: coreSettings.biometricMethod !== BiometryType.None,
        };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);

        FingerprintScanner.isSensorAvailable()
            .then(() => {
                this.setState({
                    isSensorAvailable: true,
                });
            })
            .catch(() => {});
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({ coreSettings });
    };

    changeBiometricMethod = (value: boolean) => {
        const { isSensorAvailable } = this.state;

        if (value) {
            if (!isSensorAvailable) {
                Alert.alert(Localize.t('global.error'), Localize.t('global.biometricIsNotAvailable'));
                return;
            }

            FingerprintScanner.authenticate({ description: Localize.t('global.authenticate'), fallbackEnabled: true })
                .then(() => {
                    FingerprintScanner.isSensorAvailable().then((biometryType) => {
                        let type;

                        switch (biometryType) {
                            case 'Face ID':
                                type = BiometryType.FaceID;
                                break;
                            case 'Touch ID':
                                type = BiometryType.TouchID;
                                break;
                            case 'Biometrics':
                                type = BiometryType.Biometrics;
                                break;

                            default:
                                type = BiometryType.None;
                        }

                        CoreRepository.saveSettings({ biometricMethod: type });
                    });

                    this.setState({
                        biometricEnabled: true,
                    });
                })
                .catch(() => {
                    Alert.alert(Localize.t('global.invalidAuth'), Localize.t('global.invalidBiometryAuth'));
                })
                .finally(() => {
                    FingerprintScanner.release();
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
                    onSuccess: () => {
                        this.changeBiometricMethod(value);
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

    eraseDataChange = (value: boolean) => {
        CoreRepository.saveSettings({
            purgeOnBruteForce: value,
        });
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
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={biometricEnabled} onChange={this.biometricMethodChange} />
                        </View>
                    </View>

                    <Text style={styles.descriptionText}>{Localize.t('settings.additionalSecurity')}</Text>
                    <View style={styles.row}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('settings.eraseData')}</Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={coreSettings.purgeOnBruteForce} onChange={this.eraseDataChange} />
                        </View>
                    </View>
                    <Text style={styles.destructionLabel}>{Localize.t('settings.eraseDataDescription')}</Text>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SecuritySettingsView;
