import { isEqual } from 'lodash';
import React, { Component } from 'react';
import { View } from 'react-native';

import {
    // TouchableDebounce,
    // Icon,
    SearchBar,
    Button,
} from '@components/General';

import Localize from '@locale';

// import { AppSizes } from '@theme';
import styles from './styles';
import { CoreRepository } from '@store/repositories';
// import { AppStyles } from '@theme/index';

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
    onAddTokenPress: () => void;
}

interface State {
    ownUpdate: boolean;
    filterText?: string;
    favoritesEnabled: boolean;
    hideZeroEnabled: boolean;
    displayButtons: boolean;
}

/* Component ==================================================================== */
class ListFilter extends Component<Props, State> {
    private readonly searchInputRef: React.RefObject<SearchBar>;

    constructor(props: Props) {
        super(props);
        
        this.state = {
            ownUpdate: false,
            filterText: props.filters?.text || undefined,
            favoritesEnabled: props.filters?.favorite || false,
            hideZeroEnabled: props.filters?.hideZero || false,
            displayButtons: true,
        };

        this.searchInputRef = React.createRef();
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>): boolean {
        const { visible } = this.props;
        const { filterText, favoritesEnabled, hideZeroEnabled, displayButtons } = this.state;

        return (
            !isEqual(nextState.displayButtons, displayButtons) ||
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

        CoreRepository.saveSettings({ filterHideZeroValue: hideZeroEnabled });

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
        this.setState({
            displayButtons: false,
        });
    };

    onSearchInputBlur = () => {
        this.setState({
            displayButtons: true,
        });
    };

    onSearchClearButtonPress = () => {
        if (this.searchInputRef.current) {
            this.searchInputRef.current.blur();
        }
    };

    render() {
        const { visible, filters, onAddTokenPress } = this.props;
        const { favoritesEnabled, hideZeroEnabled, displayButtons } = this.state;

        // hide filters when reordering is enabled
        if (!visible) {
            return null;
        }

        return (
            <>
                <View style={styles.container}>
                    <SearchBar
                        ref={this.searchInputRef}
                        defaultValue={filters && filters?.text || ''}
                        height={styles.filterButton.height}
                        onChangeText={this.onFilterTextChange}
                        onFocus={this.onSearchInputFocus}
                        onBlur={this.onSearchInputBlur}
                        onClearButtonPress={this.onSearchClearButtonPress}
                        placeholder={Localize.t('global.filterTokens')}
                        containerStyle={styles.searchBarContainer}
                        inputStyle={styles.searchBarInput}
                        iconStyle={styles.searchBarIcon}
                        clearButtonVisibility="nonempty"
                        iconSize={23}
                    />
                </View>
                <View style={[styles.buttonContainer]}>
                    <Button
                        numberOfLines={1}
                        secondary
                        icon={hideZeroEnabled ? 'IconHideZero' : 'IconShowZero'}
                        iconStyle={[
                            hideZeroEnabled && styles.hideZeroIconActive,
                        ]}
                        iconPosition='left'
                        iconSize={18}
                        style={[
                            styles.filterBtn,
                            !displayButtons && styles.notVisible,
                        ]}
                        onPress={this.onHideZeroPress}
                        // textStyle={[AppStyles.subtext, AppStyles.bold]}
                        label={Localize.t(!hideZeroEnabled ? 'global.showZeroValue' : 'global.hideZeroValue')}
                    />
                    <Button
                        numberOfLines={1}
                        secondary
                        icon='IconStarFull'
                        iconStyle={[
                            favoritesEnabled && styles.favoriteIconActive,
                        ]}
                        iconPosition='left'
                        iconSize={18}
                        style={[
                            styles.filterBtn,
                            !displayButtons && styles.notVisible,
                        ]}
                        onPress={this.onFavoritePress}
                        // textStyle={[AppStyles.subtext, AppStyles.bold]}
                        label={Localize.t(!favoritesEnabled ? 'global.showAll' : 'global.showFavsOnly')}
                    />
                    <Button
                        icon='IconReorder'
                        contrast
                        iconSize={23}
                        style={[
                            styles.filterBtn,
                            !displayButtons && styles.notVisible,
                        ]}
                        onPress={this.onReorderPress}
                        label={Localize.t('global.reorder')}
                    />
                    <Button
                        icon='IconPlus'
                        iconSize={22}
                        style={[
                            styles.filterBtn,
                            !displayButtons && styles.notVisible,
                        ]}
                        onPress={onAddTokenPress}
                        label={Localize.t('home.addAsset')}
                    />
                </View>
            </>
        );
    }
}

export default ListFilter;
