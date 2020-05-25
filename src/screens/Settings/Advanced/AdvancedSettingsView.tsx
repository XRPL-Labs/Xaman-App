/**
 * Advanced Settings Screen
 */

import { find } from 'lodash';
import React, { Component } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';

import DeviceInfo from 'react-native-device-info';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';

import { AppScreens, AppConfig } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import { Header, Icon } from '@components';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    coreSettings: CoreSchema;
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
        };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({
            coreSettings,
        });
    };

    getCurrentExplorerTitle = () => {
        const { coreSettings } = this.state;

        const { defaultExplorer } = coreSettings;

        const explorer = find(AppConfig.explorer, { value: defaultExplorer });

        return explorer.title;
    };

    changeDefaultExplorer = (selected: any) => {
        const { value } = selected;
        // save in store
        CoreRepository.saveSettings({ defaultExplorer: value });
    };

    showExplorerPicker = () => {
        const { coreSettings } = this.state;

        Navigator.push(
            AppScreens.Modal.Picker,
            {},
            {
                title: Localize.t('global.explorer'),
                description: Localize.t('settings.selectExplorer'),
                items: AppConfig.explorer,
                selected: coreSettings.defaultExplorer,
                onSelect: this.changeDefaultExplorer,
            },
        );
    };

    showChangeLog = () => {
        const currentVersionCode = DeviceInfo.getVersion();

        Navigator.showOverlay(
            AppScreens.Overlay.ChangeLog,
            {
                overlay: {
                    handleKeyboardEvents: true,
                },
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            { version: currentVersionCode },
        );
    };

    render() {
        const { coreSettings } = this.state;

        return (
            <View testID="advanced-settings-view" style={[styles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('global.advanced') }}
                />

                <ScrollView>
                    <Text style={styles.descriptionText}>{Localize.t('settings.nodeAndExplorer')}</Text>
                    <TouchableOpacity
                        style={[styles.row]}
                        onPress={() => {
                            Navigator.push(AppScreens.Settings.Node.List);
                        }}
                    >
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('global.node')}</Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={[styles.value]}>{coreSettings.defaultNode}</Text>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.row]} onPress={this.showExplorerPicker}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('global.explorer')}</Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={[styles.value]}>{this.getCurrentExplorerTitle()}</Text>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.descriptionText}>{Localize.t('settings.releaseInformation')}</Text>
                    <View style={[styles.row]}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('global.version')}</Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text selectable style={[styles.value]}>
                                {DeviceInfo.getReadableVersion()}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={[styles.row]} onPress={this.showChangeLog}>
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('settings.viewChangeLog')}</Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.descriptionText}>{Localize.t('global.debug')}</Text>
                    <View style={[styles.row]}>
                        <View style={[AppStyles.flex1]}>
                            <Text style={styles.label}>{Localize.t('global.deviceUUID')}</Text>
                        </View>

                        <View style={[AppStyles.flex2]}>
                            <Text selectable numberOfLines={1} adjustsFontSizeToFit style={[styles.value]}>
                                {DeviceInfo.getUniqueId()}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity
                        style={[styles.row]}
                        onPress={() => {
                            Navigator.push(AppScreens.Settings.SessionLog);
                        }}
                    >
                        <View style={[AppStyles.flex3]}>
                            <Text style={styles.label}>{Localize.t('settings.sessionLog')}</Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default AdvancedSettingsView;
