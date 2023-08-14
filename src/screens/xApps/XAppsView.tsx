/**
 * XApps list view
 */

import Fuse from 'fuse.js';
import { get, flatMap } from 'lodash';

import React, { Component } from 'react';
import { View, InteractionManager } from 'react-native';

import { Navigation, OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

// constants
import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';
import { XAppOrigin } from '@common/libs/payload/types';

import BackendService from '@services/BackendService';

// components
import { Header, Button, TouchableDebounce, Icon, SearchBar, SegmentButton } from '@components/General';
import { AppsList, HeaderMessage } from '@components/Modules/XAppStore';
import { XAppShortList } from '@components/Modules/XAppShortList';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {}

export interface State {
    message: any;
    selectedCategory: string;
    selectedCategoryIndex: number;
    categories: any;
    dataSource: any;
    isLoading: boolean;
    // isError: boolean;
    searchEnabled: boolean;
}

/* Component ==================================================================== */
class XAppsView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.XApps;

    private searchBarRef: React.RefObject<SearchBar>;
    private navigationListener: any;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            message: undefined,
            selectedCategoryIndex: 0,
            selectedCategory: 'popular',
            categories: undefined,
            dataSource: Array(8).fill(undefined),
            searchEnabled: false,
            isLoading: false,
            // isError: false,
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
            .then((resp: any) => {
                const { selectedCategory } = this.state;
                const { message, categories } = resp;

                this.setState({
                    message,
                    categories,
                    dataSource: get(categories, selectedCategory),
                    isLoading: false,
                });
            })
            .catch(() => {
                this.setState({
                    isLoading: false,
                    // isError: true,
                });
            });
    };

    openXApp = (app: any) => {
        const { identifier, title, icon } = app;

        // open xApp browser

        Navigator.showModal(
            AppScreens.Modal.XAppBrowser,
            {
                identifier,
                title,
                icon,
                origin: XAppOrigin.XAPP_STORE,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
        );
    };

    toggleSearchBar = () => {
        const { categories, selectedCategory, searchEnabled } = this.state;

        this.setState(
            {
                dataSource: searchEnabled ? get(categories, selectedCategory) : undefined,
                searchEnabled: !searchEnabled,
            },
            () => {
                if (!searchEnabled) {
                    if (this.searchBarRef?.current) {
                        this.searchBarRef.current.focus();
                    }
                }
            },
        );
    };

    onCategoryChange = (categoryIndex: number) => {
        const { categories } = this.state;

        let category;

        switch (categoryIndex) {
            case 0:
                category = 'popular';
                break;
            case 1:
                category = 'recent';
                break;
            case 2:
                category = 'all';
                break;
            default:
                break;
        }

        this.setState({
            dataSource: get(categories, category),
            selectedCategory: category,
            selectedCategoryIndex: categoryIndex,
        });
    };

    onSearchChange = (text: string) => {
        const { categories } = this.state;
        if (!text || !categories) {
            this.setState({
                dataSource: undefined,
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

        const filteredApps = flatMap(appsFilter.search(text), 'item') as any;

        this.setState({
            dataSource: filteredApps,
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
            <TouchableDebounce onPress={this.toggleSearchBar}>
                <Icon name="IconSearch" size={25} style={styles.searchIcon} />
            </TouchableDebounce>
        );
    };

    renderContent = () => {
        const { message, categories, dataSource, selectedCategoryIndex, searchEnabled, isLoading } = this.state;

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
                    <AppsList
                        searching
                        onAppPress={this.openXApp}
                        dataSource={dataSource}
                        containerStyle={styles.appListContainer}
                    />
                </>
            );
        }

        return (
            <>
                <HeaderMessage message={message} containerStyle={styles.headerMessageContainer} />
                <XAppShortList
                    apps={categories?.featured}
                    onAppPress={this.openXApp}
                    containerStyle={styles.featuredContainer}
                />

                <SegmentButton
                    selectedIndex={selectedCategoryIndex}
                    containerStyle={AppStyles.paddingHorizontalSml}
                    buttons={[Localize.t('xapp.popular'), Localize.t('xapp.recentlyUsed'), Localize.t('xapp.all')]}
                    onPress={this.onCategoryChange}
                />

                <AppsList
                    onAppPress={this.openXApp}
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
