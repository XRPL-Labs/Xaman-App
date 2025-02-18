/**
 * XApps list view
 */

import Fuse from 'fuse.js';
import { get, flatMap, sortBy, countBy } from 'lodash';

import React, { Component } from 'react';
import { View, InteractionManager } from 'react-native';

import { Navigation, EventSubscription } from 'react-native-navigation';

import { AppScreens } from '@common/constants';

import BackendService from '@services/BackendService';

import { Header, Button, TouchableDebounce, Icon, SearchBar, SegmentButtons } from '@components/General';
import { SegmentButtonType } from '@components/General/SegmentButtons';

import { AppsList, HeaderMessage, CategoryChips, MessageType } from '@components/Modules/XAppStore';
import { CategoryChipItem } from '@components/Modules/XAppStore/CategoryChips/ChipButton';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export enum Sections {
    Home = 'Home',
    Recent = 'Recent',
    Alphabet = 'Alphabet',
    Categories = 'Categories',
}

export type SectionData = {
    title?: string;
    data: XamanBackend.AppCategory[];
};

export interface Props {}

export interface State {
    message?: MessageType;
    activeSection: Sections;
    categories?: XamanBackend.XAppStoreListingsCategories;
    categoryFilter?: string;
    dataSource: SectionData[];
    isLoading: boolean;
    searchEnabled: boolean;
}

/* Component ==================================================================== */
class XAppsView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.XApps;

    private searchBarRef: React.RefObject<SearchBar>;
    private navigationListener?: EventSubscription;

    constructor(props: Props) {
        super(props);

        this.state = {
            activeSection: Sections.Home,
            message: undefined,
            categories: undefined,
            dataSource: [
                {
                    title: Localize.t('xapp.ourSuggestions'),
                    data: Array(4).fill(undefined),
                },
                {
                    title: Localize.t('xapp.popular'),
                    data: Array(4).fill(undefined),
                },
            ],
            categoryFilter: undefined,
            searchEnabled: false,
            isLoading: false,
        };

        this.searchBarRef = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchStoreListings);

        this.navigationListener = Navigation.events().bindComponent(this);
    }

    componentWillUnmount() {
        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    componentDidAppear() {
        const { categories } = this.state;

        // update the list if used and xApp and not in recently used apps list
        if (categories) {
            this.fetchStoreListings();
        }
    }

    fetchStoreListings = () => {
        BackendService.getXAppStoreListings('message,featured,popular,recent,all')
            .then((resp) => {
                const { message, categories } = resp;

                this.setState({
                    message,
                    categories,
                    dataSource: this.buildDataSource(categories),
                    isLoading: false,
                });
            })
            .catch(() => {
                this.setState({
                    isLoading: false,
                });
            });
    };

    getAlphabetSectionData = ({ all: apps }: XamanBackend.XAppStoreListingsCategories): SectionData[] => {
        const alphabetAppCategoryMap: SectionData[] = [];

        sortBy(apps, 'title').forEach((item) => {
            if (!item || !item.title) return;

            const firstLetter = item.title.charAt(0).toUpperCase();

            if (
                alphabetAppCategoryMap.filter((r) => {
                    return r.title === firstLetter;
                }).length < 1
            ) {
                alphabetAppCategoryMap.push({ title: firstLetter, data: [] });
            }
            alphabetAppCategoryMap
                .filter((r) => {
                    return r.title === firstLetter;
                })[0]
                .data.push(item);
        });

        return sortBy(alphabetAppCategoryMap, (section) => {
            return section.title;
        });
    };

    getRecentSectionData = ({ recent: apps }: XamanBackend.XAppStoreListingsCategories): SectionData[] => {
        return [
            {
                title: Localize.t('xapp.recentlyUsed'),
                data: apps,
            },
        ];
    };

    getHomeSectionData = ({
        featured: featuredApps,
        popular: popularApps,
    }: XamanBackend.XAppStoreListingsCategories): SectionData[] => {
        return [
            {
                title: Localize.t('xapp.ourSuggestions'),
                data: featuredApps,
            },
            {
                title: Localize.t('xapp.popular'),
                data: popularApps,
            },
        ];
    };

    getCategoriesFilteredData = ({ all: allXApps }: XamanBackend.XAppStoreListingsCategories) => {
        const { categoryFilter } = this.state;

        return [
            {
                data: allXApps.filter((app) => app.category === categoryFilter),
            },
        ];
    };

    buildDataSource = (categories?: XamanBackend.XAppStoreListingsCategories, section?: Sections): SectionData[] => {
        const { activeSection } = this.state;

        if (!categories) {
            return [];
        }

        switch (section ?? activeSection) {
            case Sections.Home:
                return this.getHomeSectionData(categories);
            case Sections.Recent:
                return this.getRecentSectionData(categories);
            case Sections.Alphabet:
                return this.getAlphabetSectionData(categories);
            case Sections.Categories:
                return this.getCategoriesFilteredData(categories);
            default:
                return [];
        }
    };

    toggleSearchBar = () => {
        const { categories, searchEnabled } = this.state;

        this.setState(
            {
                dataSource: searchEnabled ? this.buildDataSource(categories) : [],
                searchEnabled: !searchEnabled,
            },
            () => {
                if (!searchEnabled) {
                    requestAnimationFrame(() => {
                        this.searchBarRef?.current?.focus();
                    });
                }
            },
        );
    };

    onSectionItemPress = (item: SegmentButtonType) => {
        const { categories } = this.state;

        this.setState({
            dataSource: this.buildDataSource(categories, item.value),
            activeSection: item.value,
        });
    };

    onSearchChange = (text: string) => {
        const { categories } = this.state;

        if (!text || !categories) {
            this.setState({
                dataSource: [],
            });
            return;
        }

        const appsFilter = new Fuse(get(categories, 'all'), {
            keys: ['title', 'identifier'],
            minMatchCharLength: 2,
            shouldSort: false,
            includeScore: false,
            threshold: 0.1,
        });

        const filteredApps = flatMap(appsFilter.search(text), 'item') as XamanBackend.AppCategory[];

        const dataSource =
            filteredApps.length > 0
                ? [
                      {
                          title: Localize.t('send.searchResults'),
                          data: filteredApps,
                      },
                  ]
                : [];

        this.setState({
            dataSource,
        });
    };

    getSegmentButtons = () => {
        return [
            {
                label: Localize.t('global.home'),
                value: Sections.Home,
            },
            {
                label: Localize.t('xapp.recent'),
                value: Sections.Recent,
            },
            {
                label: Localize.t('xapp.ADashZ'),
                value: Sections.Alphabet,
            },
            {
                label: Localize.t('xapp.categories'),
                value: Sections.Categories,
            },
        ];
    };

    getCategoryChips = () => {
        const { categories, categoryFilter } = this.state;

        const categoriesCount = countBy(categories?.all, 'category');

        return Object.keys(categoriesCount)
            .sort((a, b) => {
                return categoriesCount[b] - categoriesCount[a];
            })
            .map((category: string) => {
                return {
                    value: category,
                    count: categoriesCount[category],
                    active: category === categoryFilter,
                };
            });
    };

    onCategoryChipPress = (item: CategoryChipItem) => {
        const { categories } = this.state;

        const { value } = item;

        this.setState(
            {
                categoryFilter: value,
            },
            () => {
                this.setState({
                    dataSource: this.buildDataSource(categories, Sections.Categories),
                });
            },
        );
    };

    onCategoryChipRemovePress = () => {
        this.setState({
            categoryFilter: undefined,
            dataSource: [],
        });
    };

    renderHeaderSearchButton = () => {
        const { searchEnabled } = this.state;

        if (searchEnabled) {
            return (
                <Button
                    onPress={this.toggleSearchBar}
                    label={Localize.t('global.cancel')}
                    light
                    roundedMini
                    icon="IconX"
                    iconPosition="right"
                />
            );
        }

        return (
            <TouchableDebounce onPress={this.toggleSearchBar} hitSlop={{ left: 20, right: 20, bottom: 10, top: 10 }}>
                <Icon name="IconSearch" size={20} style={styles.searchIcon} />
            </TouchableDebounce>
        );
    };

    renderContent = () => {
        const { message, dataSource, activeSection, categoryFilter, searchEnabled, isLoading } = this.state;

        if (searchEnabled) {
            return (
                <>
                    <SearchBar
                        ref={this.searchBarRef}
                        clearButtonVisibility="never"
                        onChangeText={this.onSearchChange}
                        placeholder={Localize.t('global.search')}
                        containerStyle={styles.searchBarContainer}
                    />
                    <AppsList visible searching dataSource={dataSource} containerStyle={styles.appListContainer} />
                </>
            );
        }

        return (
            <>
                <SegmentButtons
                    activeButton={activeSection}
                    containerStyle={styles.segmentButtonsContainer}
                    buttons={this.getSegmentButtons()}
                    onItemPress={this.onSectionItemPress}
                />
                <CategoryChips
                    visible={activeSection === Sections.Categories}
                    categories={this.getCategoryChips()}
                    activeCategory={categoryFilter}
                    containerStyle={styles.categoryChipsContainer}
                    onChipRemovePress={this.onCategoryChipRemovePress}
                    onChipPress={this.onCategoryChipPress}
                />
                <HeaderMessage
                    visible={activeSection === Sections.Home}
                    message={message}
                    containerStyle={styles.headerMessageContainer}
                />
                <AppsList
                    visible={
                        !!(
                            activeSection !== Sections.Categories ||
                            (activeSection === Sections.Categories && categoryFilter)
                        )
                    }
                    dataSource={dataSource}
                    onRefresh={this.fetchStoreListings}
                    refreshing={isLoading}
                    containerStyle={styles.appListContainer}
                />
            </>
        );
    };

    render() {
        return (
            <View testID="xapp-store-tab-view" style={AppStyles.tabContainer}>
                <Header
                    placement="left"
                    containerStyle={AppStyles.headerContainer}
                    leftComponent={{
                        text: Localize.t('global.xapps'),
                        textStyle: AppStyles.h3,
                    }}
                    rightComponent={{
                        render: this.renderHeaderSearchButton,
                    }}
                />

                <View style={styles.contentContainer}>{this.renderContent()}</View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default XAppsView;
