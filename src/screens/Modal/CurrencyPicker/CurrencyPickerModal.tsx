/**
 * Currency Picker modal
 */
import { has, flatMap, isFunction, isEmpty } from 'lodash';
import Fuse from 'fuse.js';

import React, { Component } from 'react';
import { View, Text, SectionList, RefreshControl, InteractionManager } from 'react-native';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';

import { BackendService, StyleService } from '@services';

import { TouchableDebounce, Header, SearchBar, Icon, Button, Spacer } from '@components/General';

import Localize from '@locale';
// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    selected?: string;
    onSelect?: (currency: string) => void;
}

export interface State {
    isLoading: boolean;
    error: boolean;
    currencies: any;
    dataSource: any;
}

/* Component ==================================================================== */
class CurrencyPickerModal extends Component<Props, State> {
    static screenName = AppScreens.Modal.CurrencyPicker;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            error: false,
            currencies: [],
            dataSource: [],
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchCurrencies);
    }

    fetchCurrencies = () => {
        const { isLoading } = this.state;

        if (!isLoading) {
            this.setState({
                isLoading: true,
            });
        }

        BackendService.getCurrenciesList()
            .then((res: any) => {
                const { error, currencies } = res;

                this.setState({
                    currencies,
                    dataSource: this.toDataSource(currencies),
                    isLoading: false,
                    error: !!error,
                });
            })
            .catch(() => {
                this.setState({
                    isLoading: false,
                    error: true,
                });
            });
    };

    toDataSource = (currencies: any) => {
        const dataSource = [] as any;

        if (has(currencies, 'popular') && !isEmpty(currencies.popular)) {
            dataSource.push({ title: Localize.t('global.popular'), data: flatMap(currencies.popular) });
        }

        if (has(currencies, 'all') && !isEmpty(currencies.all)) {
            dataSource.push({ title: Localize.t('global.all'), data: flatMap(currencies.all) });
        }

        return dataSource;
    };

    onSearchChange = (text: string) => {
        const { currencies } = this.state;

        if (!text || !has(currencies, 'all')) {
            this.setState({
                dataSource: this.toDataSource(currencies),
            });
            return;
        }

        const allCurrencies = flatMap(currencies.all);

        const currenciesFilter = new Fuse(allCurrencies, {
            keys: ['name', 'code'],
            shouldSort: false,
            includeScore: false,
            threshold: 0.1,
        });

        const filteredCurrencies = flatMap(currenciesFilter.search(text), 'item') as any;

        this.setState({
            dataSource: this.toDataSource({ all: filteredCurrencies }),
        });
    };

    onSelect = (selectedItem: any) => {
        const { onSelect } = this.props;

        const { code } = selectedItem;

        Navigator.pop();

        if (isFunction(onSelect)) {
            onSelect(code);
        }
    };

    renderItem = ({ index, item }: { index: number; item: any }) => {
        const { selected } = this.props;

        return (
            <TouchableDebounce
                testID={`${item.code}`}
                key={index}
                style={styles.rowContainer}
                onPress={() => {
                    this.onSelect(item);
                }}
            >
                <View style={[AppStyles.flex4, AppStyles.leftAligned]}>
                    <Text style={AppStyles.subtext}>
                        <Text style={[AppStyles.bold]}>{item.code}</Text> - {item.name}
                    </Text>
                </View>
                {selected === item.code && (
                    <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                        <Icon size={20} style={styles.checkIcon} name="IconCheck" />
                    </View>
                )}
            </TouchableDebounce>
        );
    };

    renderSectionHeader = ({ section: { title } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
        );
    };

    renderListEmptyComponent = () => {
        const { isLoading } = this.state;

        if (isLoading) return null;

        return (
            <View style={[AppStyles.centerAligned, AppStyles.paddingTopSml]}>
                <Text style={[AppStyles.p]}>{Localize.t('global.noResultFound')}</Text>
            </View>
        );
    };

    render() {
        const { isLoading, error, dataSource } = this.state;

        return (
            <View testID="currency-picker-modal" style={[styles.container]}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{ text: Localize.t('global.currencies') }}
                />
                <SearchBar
                    onChangeText={this.onSearchChange}
                    placeholder={Localize.t('settings.enterCurrencyCodeOrName')}
                    containerStyle={styles.searchContainer}
                />

                {error ? (
                    <View
                        style={[
                            AppStyles.flex1,
                            AppStyles.centerAligned,
                            AppStyles.centerContent,
                            AppStyles.paddingHorizontalSml,
                        ]}
                    >
                        <Text style={[AppStyles.p, AppStyles.bold]}>
                            {Localize.t('settings.unableToLoadListOfCurrencies')}
                        </Text>
                        <Spacer size={40} />
                        <Button
                            secondary
                            roundedSmall
                            icon="IconRefresh"
                            iconSize={14}
                            onPress={this.fetchCurrencies}
                            label={Localize.t('global.tryAgain')}
                        />
                    </View>
                ) : (
                    <SectionList
                        style={[AppStyles.paddingHorizontalSml]}
                        refreshing={isLoading}
                        sections={dataSource}
                        renderItem={this.renderItem}
                        renderSectionHeader={this.renderSectionHeader}
                        keyExtractor={(item, index) => `${index}`}
                        ListEmptyComponent={this.renderListEmptyComponent}
                        windowSize={30}
                        removeClippedSubviews
                        maxToRenderPerBatch={60}
                        onRefresh={this.fetchCurrencies}
                        refreshControl={
                            <RefreshControl refreshing={isLoading} tintColor={StyleService.value('$contrast')} />
                        }
                        indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
                    />
                )}
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default CurrencyPickerModal;
