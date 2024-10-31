/**
 * Security Settings Screen
 */
import { find } from 'lodash';
import React, { Component } from 'react';
import { Text, ScrollView, View, Alert, Platform } from 'react-native';

import { AppScreens } from '@common/constants';

import { CoreRepository } from '@store/repositories';
import { CoreModel } from '@store/models';
import { BiometryType } from '@store/types';

import { Biometric, BiometricErrors } from '@common/libs/biometric';

import { Navigator } from '@common/helpers/navigator';
import { IsFlagSecure, SetFlagSecure } from '@common/helpers/app';

import { TouchableDebounce, Header, Switch, Icon, InfoMessage } from '@components/General';

import Localize from '@locale';

import { PickerModalProps } from '@screens/Global/Picker';
import { ChangePasscodeViewProps } from '@screens/Settings/Security/ChangePasscode';
import { AuthenticateOverlayProps } from '@screens/Overlay/Authenticate';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    biometricEnabled: boolean;
    biometricAvailable: boolean;
    isFlagSecure: boolean;
    coreSettings: CoreModel;
    timeItems: Array<any>;
}

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
            biometricEnabled: coreSettings.biometricMethod !== BiometryType.None,
            biometricAvailable: false,
            isFlagSecure: true,
            timeItems: [
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
            ],
        };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);

        // check if flag secure is set
        IsFlagSecure().then((enabled) => {
            this.setState({
                isFlagSecure: enabled,
            });
        });

        // check if biometric is available in advance
        Biometric.isSensorAvailable()
            .then(() => {
                this.setState({
                    biometricAvailable: true,
                });
            })
            .catch(() => {});
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreModel) => {
        this.setState({ coreSettings });
    };

    // NOTE: this method should only run after success passcode authentication
    enableBiometricAuthentication = async () => {
        try {
            // before enabling the biometrics check if the sensor is available
            await Biometric.isSensorAvailable();
            // refresh authentication key
            await Biometric.refreshAuthenticationKey();
        } catch {
            Alert.alert(Localize.t('global.error'), Localize.t('global.biometricIsNotAvailable'));
            return;
        }

        // authenticate to make sure user can authenticate with biometrics
        Biometric.authenticate(Localize.t('global.authenticate'))
            .then((biometryType) => {
                // persist biometric method
                CoreRepository.saveSettings({ biometricMethod: biometryType });

                // set biometric enabled
                this.setState({
                    biometricEnabled: true,
                });
            })
            .catch((error: any) => {
                if (error.name !== BiometricErrors.ERROR_USER_CANCEL) {
                    Alert.alert(Localize.t('global.invalidAuth'), Localize.t('global.invalidBiometryAuth'));
                }
            });
    };

    disableBiometricAuthentication = async () => {
        // disable biometric
        CoreRepository.saveSettings({ biometricMethod: BiometryType.None });

        this.setState({
            biometricEnabled: false,
        });
    };

    changeBiometricStatus = (enabled: boolean) => {
        if (enabled) {
            this.enableBiometricAuthentication();
        } else {
            this.disableBiometricAuthentication();
        }
    };

    onBiometricEnableChange = (enabled: boolean) => {
        // ask for passcode authentication before Enabling/Disabling the biometrics
        Navigator.showOverlay<AuthenticateOverlayProps>(AppScreens.Overlay.Auth, {
            canAuthorizeBiometrics: false,
            onSuccess: () => {
                this.changeBiometricStatus(enabled);
            },
        });
    };

    onLogoutTimeSelected = (item: any) => {
        CoreRepository.saveSettings({
            minutesAutoLock: item.value,
        });
    };

    showLogoutTimePicker = () => {
        const { coreSettings, timeItems } = this.state;

        Navigator.push<PickerModalProps>(AppScreens.Global.Picker, {
            title: Localize.t('global.autoLock'),
            description: Localize.t('settings.autoLockAfter'),
            items: timeItems,
            selected: coreSettings.minutesAutoLock,
            onSelect: this.onLogoutTimeSelected,
        });
    };

    onChangePasscodePress = () => {
        Navigator.push<ChangePasscodeViewProps>(
            AppScreens.Settings.ChangePasscode,
            {},
            {
                animations: {
                    push: {
                        enabled: false,
                    },
                },
            },
        );
    };

    onEraseDataToggle = (value: boolean) => {
        CoreRepository.saveSettings({
            purgeOnBruteForce: value,
        });
    };

    onDiscreetModeToggle = (value: boolean) => {
        CoreRepository.saveSettings({
            discreetMode: value,
        });
    };

    onFlagSecureToggle = (value: boolean) => {
        // apply to the current activity
        SetFlagSecure(value);

        // update the state
        this.setState({
            isFlagSecure: value,
        });
    };

    render() {
        const { biometricAvailable, biometricEnabled, coreSettings, isFlagSecure, timeItems } = this.state;

        return (
            <View testID="security-settings-screen" style={styles.container}>
                <Header
                    leftComponent={{
                        testID: 'back-button',
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('settings.securitySetting') }}
                />

                <ScrollView>
                    <Text style={styles.descriptionText}>{Localize.t('global.authentication')}</Text>
                    <TouchableDebounce
                        testID="change-passcode-button"
                        style={styles.row}
                        onPress={this.onChangePasscodePress}
                    >
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.changePasscode')}
                            </Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableDebounce>

                    <TouchableDebounce testID="auto-lock-button" style={styles.row} onPress={this.showLogoutTimePicker}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.autoLock')}
                            </Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text numberOfLines={1} style={styles.value}>
                                {find(timeItems, { value: coreSettings.minutesAutoLock }).title}
                            </Text>
                            <Icon size={25} style={styles.rowIcon} name="IconChevronRight" />
                        </View>
                    </TouchableDebounce>

                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.biometricAuthentication')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch
                                isDisabled={!biometricAvailable}
                                checked={biometricEnabled}
                                onChange={this.onBiometricEnableChange}
                            />
                        </View>
                    </View>
                    {!biometricAvailable && (
                        <InfoMessage
                            flat
                            label={Localize.t('settings.biometricUnavailableDescription')}
                            type="neutral"
                        />
                    )}

                    <Text numberOfLines={1} style={styles.descriptionText}>
                        {Localize.t('settings.additionalSecurity')}
                    </Text>
                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.eraseData')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={coreSettings.purgeOnBruteForce} onChange={this.onEraseDataToggle} />
                        </View>
                    </View>
                    <InfoMessage flat label={Localize.t('settings.eraseDataDescription')} type="error" />

                    <Text numberOfLines={1} style={styles.descriptionText}>
                        {Localize.t('global.other')}
                    </Text>
                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.hideBalance')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={coreSettings.discreetMode} onChange={this.onDiscreetModeToggle} />
                        </View>
                    </View>

                    {Platform.OS === 'android' && (
                        <>
                            <View style={styles.row}>
                                <View style={AppStyles.flex3}>
                                    <Text numberOfLines={1} style={styles.label}>
                                        {Localize.t('settings.blockTakingScreenshots')}
                                    </Text>
                                </View>
                                <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                                    <Switch
                                        isDisabled={coreSettings.developerMode}
                                        checked={isFlagSecure}
                                        onChange={this.onFlagSecureToggle}
                                    />
                                </View>
                            </View>

                            {coreSettings.developerMode && (
                                <InfoMessage
                                    flat
                                    label={Localize.t('settings.blockingTakingScreenShotsIsDisabled')}
                                    type="error"
                                />
                            )}
                        </>
                    )}
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SecuritySettingsView;
