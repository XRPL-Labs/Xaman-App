/**
 * General Settings Screen
 */

import { uniqBy, sortBy } from 'lodash';

import React, { Component } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { GetDeviceLocaleSettings } from '@common/helpers/device';

import { AppScreens } from '@common/constants';

import { CoreRepository } from '@store/repositories';
import { CoreSchema } from '@store/schemas/latest';

import { Header, Icon, Switch } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    coreSettings: CoreSchema;
    locales: any;
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

        this.state = { coreSettings: CoreRepository.getSettings(), locales: Localize.getLocales() };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreSchema) => {
        this.setState({ coreSettings });
    };

    showLanguagePicker = () => {
        const { coreSettings, locales } = this.state;

        let normalizedLocales = [];

        for (const locale of locales) {
            normalizedLocales.push({
                value: locale.code,
                title: locale.nameLocal,
            });
        }

        normalizedLocales = sortBy(uniqBy(normalizedLocales, 'title'), 'title');

        Navigator.push(
            AppScreens.Modal.Picker,
            {},
            {
                title: Localize.t('global.language'),
                description: Localize.t('settings.selectLanguage'),
                items: normalizedLocales,
                selected: coreSettings.language,
                onSelect: this.onLanguageSelected,
            },
        );
    };

    showCurrencyPicker = () => {
        const { coreSettings } = this.state;

        Navigator.push(
            AppScreens.Modal.CurrencyPicker,
            {},
            {
                selected: coreSettings.currency,
                onSelect: this.onCurrencySelected,
            },
        );
    };

    onCurrencySelected = (currencyCode: string) => {
        // save in store
        CoreRepository.saveSettings({ currency: currencyCode });
    };

    onLanguageSelected = ({ value }: { value: string }) => {
        // save in store
        CoreRepository.saveSettings({ language: value });

        // change it from local instance
        Localize.setLocale(value);

        // re-render the app
        Navigator.reRender();
    };

    onSystemSeparatorChange = async (value: boolean) => {
        CoreRepository.saveSettings({
            useSystemSeparators: value,
        });

        if (value) {
            const localeSettings = await GetDeviceLocaleSettings();
            Localize.setSettings(localeSettings);
        } else {
            Localize.setSettings(undefined);
        }

        // re-render the app
        Navigator.reRender();
    };

    hapticFeedbackChange = (value: boolean) => {
        CoreRepository.saveSettings({
            hapticFeedback: value,
        });
    };

    getLanguageTitle = (): string => {
        const { coreSettings, locales } = this.state;

        const locale = locales.find((x: any) => x.code === coreSettings.language);

        return locale.nameLocal;
    };

    render() {
        const { coreSettings } = this.state;

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
                    <TouchableOpacity style={[styles.row]} onPress={this.showLanguagePicker}>
                        <View style={[AppStyles.flex3]}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.language')}
                            </Text>
                        </View>
                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={[styles.value]}>{this.getLanguageTitle()}</Text>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.row]} onPress={this.showCurrencyPicker}>
                        <View style={[AppStyles.flex3]}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.currency')}
                            </Text>
                        </View>
                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={[styles.value]}>{coreSettings.currency}</Text>
                            <Icon size={25} style={[styles.rowIcon]} name="IconChevronRight" />
                        </View>
                    </TouchableOpacity>

                    <View style={styles.row}>
                        <View style={[AppStyles.flex3]}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.hapticFeedback')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={coreSettings.hapticFeedback} onChange={this.hapticFeedbackChange} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[AppStyles.flex3]}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.useSystemSeparators')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch
                                checked={coreSettings.useSystemSeparators}
                                onChange={this.onSystemSeparatorChange}
                            />
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default GeneralSettingsView;
