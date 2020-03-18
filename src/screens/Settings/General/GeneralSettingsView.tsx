/**
 * General Settings Screen
 */

import filter from 'lodash/filter';
import React, { Component } from 'react';
import { View, Text, TouchableOpacity, ScrollView, NativeModules } from 'react-native';

import { Navigator, Prompt } from '@common/helpers';
import { AppScreens, AppConfig } from '@common/constants';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';

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
class GeneralSettingsView extends Component<Props, State> {
    static screenName = AppScreens.Settings.General;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = { coreSettings: CoreRepository.getSettings() };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({ coreSettings });
    };

    showAccessLevelPicker = () => {
        const { coreSettings } = this.state;

        Navigator.push(
            AppScreens.Modal.Picker,
            {},
            {
                title: Localize.t('global.language'),
                description: Localize.t('settings.selectLanguage'),
                items: AppConfig.language.supported,
                selected: coreSettings.language,
                onSelect: this.onLanguageSelected,
            },
        );
    };

    changeLanguage = (selected: any) => {
        const { value } = selected;
        const { UtilsModule } = NativeModules;

        // save in store
        CoreRepository.saveSettings({ language: value });

        // change it from local instance
        Localize.setLocale(value);

        UtilsModule.restartBundle();
    };

    onLanguageSelected = (selected: any) => {
        Prompt(
            Localize.t('global.warning'),
            Localize.t('global.changingLanguageNeedsRestartToTakeEffect'),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.doIt'),
                    onPress: () => {
                        this.changeLanguage(selected);
                    },
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    render() {
        const { coreSettings } = this.state;

        const language = filter(AppConfig.language.supported, l => {
            return l.value === coreSettings.language;
        })[0];

        return (
            <View testID="general-settings-view" style={[styles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('settings.generalSettings') }}
                />
                <ScrollView>
                    {/* Account Label */}
                    <TouchableOpacity style={[styles.row]} onPress={this.showAccessLevelPicker}>
                        <View style={[styles.labelContainer]}>
                            <Text style={styles.label}>{Localize.t('global.language')}</Text>
                        </View>

                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={[styles.value]}>{language.title}</Text>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default GeneralSettingsView;
