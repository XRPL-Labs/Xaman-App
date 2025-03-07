/**
 * General Settings Screen
 */

import { uniqBy, sortBy, toLower } from 'lodash';

import React, { Component } from 'react';
import { View, Text, ScrollView } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { GetDeviceLocaleSettings } from '@common/helpers/device';

import { AppScreens } from '@common/constants';

import { CoreRepository } from '@store/repositories';
import { CoreModel } from '@store/models';
import { Themes } from '@store/types';

import { TouchableDebounce, Header, Icon, Switch } from '@components/General';

import Localize from '@locale';

import { PickerModalProps } from '@screens/Global/Picker';
import { CurrencyPickerModalProps } from '@screens/Modal/CurrencyPicker';

import { AppStyles } from '@theme';
import styles from './styles';
import StyleService from '@services/StyleService';

/* types ==================================================================== */
export interface Props {}

export interface State {
    coreSettings: CoreModel;
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

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            locales: Localize.getLocales(),
        };
    }

    componentDidMount() {
        CoreRepository.on('updateSettings', this.updateUI);
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.updateUI);
    }

    updateUI = (coreSettings: CoreModel) => {
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

        Navigator.push<PickerModalProps>(AppScreens.Global.Picker, {
            title: Localize.t('global.language'),
            description: Localize.t('settings.selectLanguage'),
            items: normalizedLocales,
            selected: coreSettings.language,
            onSelect: this.onLanguageSelected,
        });
    };

    showCurrencyPicker = () => {
        const { coreSettings } = this.state;

        Navigator.push<CurrencyPickerModalProps>(AppScreens.Modal.CurrencyPicker, {
            selected: coreSettings.currency,
            onSelect: this.onCurrencySelected,
        });
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

    hideAdvisoryTransactionsChange = (value: boolean) => {
        CoreRepository.saveSettings({
            hideAdvisoryTransactions: value,
        });
    };

    hideServiceFeeTransactionsChange = (value: boolean) => {
        CoreRepository.saveSettings({
            hideServiceFeeTransactions: value,
        });
    };

    hapticFeedbackChange = (value: boolean) => {
        CoreRepository.saveSettings({
            hapticFeedback: value,
        });
    };

    onShowReservePanelChange = (value: boolean) => {
        CoreRepository.saveSettings({
            showReservePanel: value,
        });
    };

    getLanguageTitle = (): string => {
        const { coreSettings, locales } = this.state;

        const locale = locales.find((x: any) => x.code === coreSettings.language);

        return locale.nameLocal;
    };

    changeTheme = (theme: Themes) => {
        CoreRepository.saveSettings({theme});
        StyleService.initialize(CoreRepository.getSettings())
            .then(() => {
                requestAnimationFrame(() => {
                    Navigator.switchTheme();
                });
            });
    };

    onThemeSelect = (selected: Themes) => {
        this.changeTheme(selected);
        // Prompt(
        //     Localize.t('global.warning'),
        //     Localize.t('settings.changingThemeNeedsRestartToTakeEffect'),
        //     [
        //         { text: Localize.t('global.cancel') },
        //         {
        //             text: Localize.t('global.quitApp'),
        //             onPress: () => {
        //                 this.changeTheme(selected);
        //             },
        //             style: 'destructive',
        //         },
        //     ],
        //     { type: 'default' },
        // );
    };

    renderThemeButton = (theme: Themes, { title, description }: any) => {
        const { coreSettings } = this.state;

        let previewStyle;

        switch (theme) {
            case 'light':
                previewStyle = styles.themePreviewLight;
                break;
            case 'dark':
                previewStyle = styles.themePreviewDark;
                break;
            case 'moonlight':
                previewStyle = styles.themePreviewMoonlight;
                break;
            case 'royal':
                previewStyle = styles.themePreviewRoyal;
                break;
            default:
                break;
        }

        const selected = toLower(coreSettings.theme) === theme;

        return (
            <TouchableDebounce
                key={theme}
                testID={`theme-${theme}`}
                activeOpacity={selected ? 1 : 0.8}
                onPress={() => {
                    if (!selected) {
                        this.onThemeSelect(theme);
                    }
                }}
                style={[styles.themeItem, selected && styles.themeItemSelected]}
            >
                <View style={AppStyles.flex1}>
                    <View style={[styles.themeItemDot, selected && styles.themeItemDotSelected]}>
                        {selected && <View style={styles.themeItemFilled} />}
                    </View>
                </View>
                <View style={AppStyles.flex5}>
                    <Text style={[styles.themeItemLabelText, selected && styles.themeItemSelectedText]}>{title}</Text>
                    <Text style={[styles.themeItemLabelSmall, selected && styles.themeItemSelectedText]}>
                        {description}
                    </Text>
                </View>
                <View style={[AppStyles.flex1, styles.themePreview, previewStyle]}>
                    <Text style={[AppStyles.p, AppStyles.strong, previewStyle]}>Aa</Text>
                </View>
            </TouchableDebounce>
        );
    };

    render() {
        const { coreSettings } = this.state;

        const themeItems = {
            light: {
                title: Localize.t('global.default'),
                description: Localize.t('settings.lightThemeDescription'),
            },
            dark: {
                title: Localize.t('global.dark'),
                description: Localize.t('settings.darkThemeDescription'),
            },
            moonlight: {
                title: Localize.t('global.moonlight'),
                description: Localize.t('settings.moonlightThemeDescription'),
            },
            royal: {
                title: Localize.t('global.royal'),
                description: Localize.t('settings.royalThemeDescription'),
            },
        };

        return (
            <View testID="general-settings-view" style={styles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: Navigator.pop,
                    }}
                    centerComponent={{ text: Localize.t('settings.generalSettings') }}
                />
                <ScrollView>
                    <View style={styles.row}>
                        <View style={AppStyles.flex1}>
                            <Text style={AppStyles.pbold}>{Localize.t('global.theme')}</Text>
                        </View>
                    </View>
                    <View style={styles.rowNoBorder}>
                        <View style={AppStyles.flex1}>
                            {/* @ts-ignore */}
                            {Object.keys(themeItems).map((key: Themes) => this.renderThemeButton(key, themeItems[key]))}
                        </View>
                    </View>

                    <TouchableDebounce style={styles.row} onPress={this.showLanguagePicker}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.language')}
                            </Text>
                        </View>
                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={styles.value}>{this.getLanguageTitle()}</Text>
                            <Icon size={25} style={styles.rowIcon} name="IconChevronRight" />
                        </View>
                    </TouchableDebounce>

                    <TouchableDebounce style={styles.row} onPress={this.showCurrencyPicker}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('global.currency')}
                            </Text>
                        </View>
                        <View style={[AppStyles.centerAligned, AppStyles.row]}>
                            <Text style={styles.value}>{coreSettings.currency}</Text>
                            <Icon size={25} style={styles.rowIcon} name="IconChevronRight" />
                        </View>
                    </TouchableDebounce>

                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.hideAdvisoryTransactions')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch
                                checked={coreSettings.hideAdvisoryTransactions}
                                onChange={this.hideAdvisoryTransactionsChange}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.hideServiceFeeTransactions')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch
                                checked={coreSettings.hideServiceFeeTransactions}
                                onChange={this.hideServiceFeeTransactionsChange}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.hapticFeedback')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={coreSettings.hapticFeedback} onChange={this.hapticFeedbackChange} />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
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

                    <View style={styles.row}>
                        <View style={AppStyles.flex3}>
                            <Text numberOfLines={1} style={styles.label}>
                                {Localize.t('settings.showReserveValue')}
                            </Text>
                        </View>
                        <View style={[AppStyles.rightAligned, AppStyles.flex1]}>
                            <Switch checked={coreSettings.showReservePanel} onChange={this.onShowReservePanelChange} />
                        </View>
                    </View>
                </ScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default GeneralSettingsView;
