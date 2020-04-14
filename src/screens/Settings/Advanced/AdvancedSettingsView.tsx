/**
 * Advanced Settings Screen
 */

import React, { Component } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';

import { AppScreens } from '@common/constants';
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
                    <Text style={styles.descriptionText}>{Localize.t('settings.connectingXRPLNode')}</Text>
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

                    <Text style={styles.descriptionText}>{Localize.t('global.debug')}</Text>
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
