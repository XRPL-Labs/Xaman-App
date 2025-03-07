import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { View } from 'react-native';

import { TouchableDebounce, Icon, SearchBar } from '@components/General';

import Localize from '@locale';

// import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
export interface FiltersType {
    text?: string;
    favorite?: boolean;
    hideZero?: boolean;
}

interface Props {
    filters?: FiltersType;
    visible: boolean;
    onFilterChange: (filters: FiltersType | undefined) => void;
    onReorderPress: () => void;
}

interface State {
    ownUpdate: boolean;
    filterText?: string;
    favoritesEnabled: boolean;
    hideZeroEnabled: boolean;
}

/* Component ==================================================================== */
class ListFilter extends Component<Props, State> {
    private readonly searchInputRef: React.RefObject<SearchBar>;

    constructor(props: Props) {
        super(props);

        this.state = {
            ownUpdate: false,
            filterText: undefined,
            favoritesEnabled: false,
            hideZeroEnabled: false,
        };

        this.searchInputRef = React.createRef();
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
        const { visible } = this.props;
        const { filterText, favoritesEnabled, hideZeroEnabled } = this.state;

        return (
            !isEqual(nextProps.visible, visible) ||
            !isEqual(nextState.filterText, filterText) ||
            !isEqual(nextState.favoritesEnabled, favoritesEnabled) ||
            !isEqual(nextState.hideZeroEnabled, hideZeroEnabled)
        );
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        const { filterText } = this.state;

        // clear search text when filter text cleared
        if (prevState.filterText && !filterText) {
            if (this.searchInputRef.current) {
                this.searchInputRef.current.clearText();
            }
        }
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> | null {
        if (prevState.ownUpdate) {
            return {
                ownUpdate: false,
            };
        }

        // if filters are cleared by parent component clear
        if (
            !nextProps.filters &&
            (prevState.filterText !== undefined || prevState.favoritesEnabled || prevState.hideZeroEnabled)
        ) {
            return {
                filterText: undefined,
                favoritesEnabled: false,
                hideZeroEnabled: false,
            };
        }

        return null;
    }

    onFilterChange = () => {
        const { onFilterChange } = this.props;
        const { filterText, favoritesEnabled, hideZeroEnabled } = this.state;

        // if no filter applied return undefined
        let filters;
        if (filterText || favoritesEnabled || hideZeroEnabled) {
            filters = {
                text: filterText,
                favorite: favoritesEnabled,
                hideZero: hideZeroEnabled,
            };
        }

        if (typeof onFilterChange === 'function') {
            onFilterChange(filters);
        }
    };

    onReorderPress = () => {
        const { onReorderPress } = this.props;

        if (typeof onReorderPress === 'function') {
            onReorderPress();
        }
    };

    onFavoritePress = () => {
        const { favoritesEnabled } = this.state;

        this.setState({
            filterText: undefined,
        }, () => {
            this.setState({
                ownUpdate: true,
                filterText: undefined,
                favoritesEnabled: !favoritesEnabled,
            }, this.onFilterChange);
        });
    };

    onHideZeroPress = () => {
        const { hideZeroEnabled } = this.state;

        this.setState({
            filterText: undefined,
        }, () => {
            this.setState({
                ownUpdate: true,
                hideZeroEnabled: !hideZeroEnabled,
            }, this.onFilterChange);    
        });
    };

    onFilterTextChange = (filterText: string) => {
        this.setState({
            ownUpdate: true,
            hideZeroEnabled: false,
            favoritesEnabled: false,
            filterText,
        }, this.onFilterChange);
    };

    onSearchInputFocus = () => {
    };

    onSearchInputBlur = () => {
    };

    onSearchClearButtonPress = () => {
        if (this.searchInputRef.current) {
            this.searchInputRef.current.blur();
        }
    };

    render() {
        const { visible } = this.props;
        const { favoritesEnabled, hideZeroEnabled } = this.state;

        // hide filters when reordering is enabled
        if (!visible) {
            return null;
        }

        return (
            <View style={styles.container}>
                <SearchBar
                    ref={this.searchInputRef}
                    height={styles.filterButton.height}
                    onChangeText={this.onFilterTextChange}
                    onFocus={this.onSearchInputFocus}
                    onBlur={this.onSearchInputBlur}
                    onClearButtonPress={this.onSearchClearButtonPress}
                    placeholder={Localize.t('global.filter')}
                    containerStyle={styles.searchBarContainer}
                    inputStyle={styles.searchBarInput}
                    iconStyle={styles.searchBarIcon}
                    clearButtonVisibility="focus"
                    iconSize={15}
                />
                <View
                    style={[
                        styles.filterButtonsContainer,
                    ]}
                >
                    <TouchableDebounce onPress={this.onReorderPress} style={[styles.filterButton]}>
                        <Icon name="IconReorder" style={[styles.filterButtonIcon]} />
                    </TouchableDebounce>
                    <TouchableDebounce
                        onPress={this.onFavoritePress}
                        style={[styles.filterButton, favoritesEnabled && styles.favoriteButtonActive]}
                    >
                        <Icon
                            name="IconStarFull"
                            size={16}
                            style={[styles.filterButtonIcon, favoritesEnabled && styles.favoriteIconActive]}
                        />
                    </TouchableDebounce>
                    <TouchableDebounce
                        onPress={this.onHideZeroPress}
                        style={[styles.filterButton, hideZeroEnabled && styles.hideZeroButtonActive]}
                    >
                        <Icon
                            name={hideZeroEnabled ? 'IconHideZero' : 'IconShowZero'}
                            size={16}
                            style={[styles.filterButtonIcon, hideZeroEnabled && styles.hideZeroIconActive]}
                        />
                    </TouchableDebounce>
                </View>
            </View>
        );
    }
}

export default ListFilter;
