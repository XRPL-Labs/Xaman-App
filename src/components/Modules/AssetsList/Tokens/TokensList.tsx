import { toLower, map, filter, sortBy, isEqual, has, findIndex } from 'lodash';
import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { Navigator } from '@common/helpers/navigator';

import { CurrencyRepository, TrustLineRepository } from '@store/repositories';
import { AccountModel, TrustLineModel } from '@store/models';

import { SortableFlatList } from '@components/General';

import { AddTokenOverlayProps } from '@screens/Overlay/AddToken';
import { ExplainBalanceOverlayProps } from '@screens/Overlay/ExplainBalance';
import { Props as TokenSettingsOverlayProps } from '@screens/Overlay/TokenSettings/types';

import { TokenItem } from '@components/Modules/AssetsList/Tokens/TokenItem';
import { NativeItem } from '@components/Modules/AssetsList/Tokens/NativeItem';
import { ListHeader } from '@components/Modules/AssetsList/Tokens/ListHeader';
import { ListEmpty } from '@components/Modules/AssetsList/Tokens/ListEmpty';
import { ListFilter, FiltersType } from '@components/Modules/AssetsList/Tokens/ListFilter';

/* Types ==================================================================== */
interface Props {
    style?: ViewStyle | ViewStyle[];
    account: AccountModel;
    discreetMode: boolean;
    spendable: boolean;

    onChangeCategoryPress: () => void;
}

interface State {
    accountStateVersion: number;
    account: AccountModel;
    tokens: TrustLineModel[];
    dataSource: TrustLineModel[];
    filters?: FiltersType;
    reorderEnabled: boolean;
}

/* Component ==================================================================== */
class TokensList extends Component<Props, State> {
    private readonly dragSortableRef: React.RefObject<SortableFlatList>;

    constructor(props: Props) {
        super(props);

        const { account } = props;
        const tokens = (account.lines?.sorted([['order', false]]) as TrustLineModel[] | undefined) ?? [];

        this.state = {
            accountStateVersion: account.getStateVersion(),
            account,
            tokens,
            dataSource: tokens,
            filters: undefined,
            reorderEnabled: false,
        };

        this.dragSortableRef = React.createRef();
    }

    componentDidMount(): void {
        // listen for token updates
        // this is needed when a single token favorite status changed
        TrustLineRepository.on('trustLineUpdate', this.onTrustLineUpdate);
        // this is needed when using ResolveService to sync the currency details
        CurrencyRepository.on('currencyDetailsUpdate', this.onCurrencyDetailsUpdate);
    }

    componentWillUnmount(): void {
        // remove trustLine update listener
        TrustLineRepository.off('trustLineUpdate', this.onTrustLineUpdate);
        // remove listener
        CurrencyRepository.off('currencyDetailsUpdate', this.onCurrencyDetailsUpdate);
    }

    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        const { discreetMode, spendable } = this.props;
        const { dataSource, accountStateVersion, reorderEnabled, filters } = this.state;

        return (
            !isEqual(nextProps.spendable, spendable) ||
            !isEqual(nextProps.discreetMode, discreetMode) ||
            !isEqual(nextState.accountStateVersion, accountStateVersion) ||
            !isEqual(nextState.reorderEnabled, reorderEnabled) ||
            !isEqual(nextState.filters, filters) ||
            !isEqual(map(nextState.dataSource, 'id').join(), map(dataSource, 'id').join())
        );
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> | null {
        // calculate account state version
        const accountStateVersion = nextProps.account.getStateVersion();

        // on switch account or data update replace the dataSource and account
        // check if prev account is not valid anymore
        if (!prevState.account.isValid() || !isEqual(accountStateVersion, prevState.accountStateVersion)) {
            // check if account switched then clear filter and reordering state
            let filtersState = {
                filters: prevState.filters,
                reorderEnabled: prevState.reorderEnabled,
            };
            if (
                (prevState.account.isValid() && !isEqual(nextProps.account.address, prevState.account.address)) ||
                !prevState.account.isValid()
            ) {
                filtersState = {
                    filters: undefined,
                    reorderEnabled: false,
                };
            }

            // apply any filter if present
            const { filters, reorderEnabled } = filtersState;

            // update tokens and dataSource
            const tokens = nextProps.account.lines?.sorted([['order', false]]) as TrustLineModel[] | undefined;
            let dataSource = filters ? TokensList.getFilteredList(tokens, filters) : tokens;

            // if reorder already enabled, keep the sorting in the dataSource and update the list
            if (reorderEnabled) {
                dataSource = sortBy(dataSource, (o) => findIndex(prevState.dataSource, { id: o.id }));
            }

            return {
                accountStateVersion,
                account: nextProps.account,
                tokens,
                dataSource,
                ...filtersState,
            };
        }

        return null;
    }

    static getFilteredList = (tokens: TrustLineModel[] | undefined, filters: FiltersType): TrustLineModel[] => {
        if (!filters) {
            return tokens ?? [];
        }

        // destruct filter variables
        const { text, favorite, hideZero } = filters;

        // default dataSource
        let filtered = tokens;

        // filter base on filter text
        if (text) {
            const normalizedSearch = toLower(text);

            filtered = filter(filtered, (item: TrustLineModel) => {
                return (
                    toLower(item.currency.name).indexOf(normalizedSearch) > -1 ||
                    toLower(item.currency?.issuerName).indexOf(normalizedSearch) > -1 ||
                    toLower(NormalizeCurrencyCode(item.currency.currencyCode)).indexOf(normalizedSearch) > -1
                );
            });
        }

        // hide lines with zero balance
        if (hideZero) {
            filtered = filter(filtered, (item: TrustLineModel) => {
                return Number(item.balance) !== 0;
            });
        }

        // only show favorite lines
        if (favorite) {
            filtered = filter(filtered, { favorite: true });
        }

        return filtered ?? [];
    };

    onCurrencyDetailsUpdate = () => {
        // update the token list if any of token details changed
        this.forceUpdate();
    };

    onTrustLineUpdate = (updatedToken: TrustLineModel, changes: Partial<TrustLineModel>) => {
        // update the token in the list if token favorite changed
        if (has(changes, 'favorite')) {
            this.forceUpdate();
        }
    };

    onTokenAddButtonPress = () => {
        const { account } = this.state;
        Navigator.showOverlay<AddTokenOverlayProps>(AppScreens.Overlay.AddToken, { account });
    };

    onTokenItemPress = (token: TrustLineModel) => {
        const { spendable } = this.props;
        const { account, reorderEnabled } = this.state;

        // ignore if reordering is enabled
        if (!token || reorderEnabled) {
            return;
        }

        if (spendable) {
            Navigator.showOverlay<TokenSettingsOverlayProps>(
                AppScreens.Overlay.TokenSettings,
                { token, account },
                {
                    overlay: {
                        interceptTouchOutside: false,
                    },
                },
            );
        }
    };

    onNativeItemPress = () => {
        const { account } = this.state;
        Navigator.showOverlay<ExplainBalanceOverlayProps>(AppScreens.Overlay.ExplainBalance, { account });
    };

    onCategoryChangePress = () => {
        const { onChangeCategoryPress } = this.props;

        if (typeof onChangeCategoryPress === 'function') {
            onChangeCategoryPress();
        }
    };

    toggleReordering = () => {
        const { tokens, reorderEnabled, filters } = this.state;

        // if we are enabling the re-ordering, we need to clear filters if any exist
        if (filters && (filters.text || filters.favorite || filters.hideZero)) {
            this.setState({
                dataSource: tokens,
                filters: undefined,
                reorderEnabled: !reorderEnabled,
            });
            return;
        }

        this.setState({
            reorderEnabled: !reorderEnabled,
        });
    };

    onTokenReorder = (data: Array<TrustLineModel>) => {
        this.setState({
            dataSource: data,
        });
    };

    onItemMoveTopPress = (token: TrustLineModel) => {
        const { dataSource } = this.state;

        // move the token to the top
        const sortedDataSource = sortBy(dataSource, ({ id }) => (id === token.id ? 0 : 1));

        // save the new order
        this.setState({
            dataSource: sortedDataSource,
        });
    };

    saveTokensOrder = () => {
        const { dataSource } = this.state;

        for (let i = 0; i < dataSource.length; i++) {
            if (dataSource[i].id) {
                TrustLineRepository.update({
                    id: dataSource[i].id,
                    order: i,
                });
            }
        }

        // toggle reordering
        this.toggleReordering();
    };

    onFilterChange = (filters?: FiltersType) => {
        const { tokens } = this.state;

        // return if no token
        if (tokens.length === 0) {
            return;
        }

        // if no filter is applied then return list
        if (!filters) {
            this.setState({
                dataSource: tokens,
                filters,
            });
            return;
        }

        // sort and update dataSource
        this.setState({
            dataSource: TokensList.getFilteredList(tokens, filters),
            filters,
        });
    };

    renderItem = ({ item, index }: { item: TrustLineModel; index: number }) => {
        const { discreetMode } = this.props;
        const { account, reorderEnabled } = this.state;

        return (
            <TokenItem
                index={index}
                token={item}
                reorderEnabled={reorderEnabled}
                discreetMode={discreetMode}
                selfIssued={item.currency.issuer === account.address}
                onPress={this.onTokenItemPress}
                onMoveTopPress={this.onItemMoveTopPress}
            />
        );
    };

    renderEmptyList = () => {
        const { filters } = this.state;

        // return null if there is any filter active
        if (filters) {
            return null;
        }

        return <ListEmpty />;
    };

    keyExtractor = (item: TrustLineModel) => {
        return `token-${item.id}`;
    };

    render() {
        const { account, style, spendable, discreetMode } = this.props;
        const { dataSource, reorderEnabled, filters } = this.state;

        return (
            <View testID="token-list-container" style={style}>
                <ListHeader
                    reorderEnabled={reorderEnabled}
                    showTokenAddButton={spendable}
                    onReorderSavePress={this.saveTokensOrder}
                    onTokenAddPress={this.onTokenAddButtonPress}
                    onTitlePress={this.onCategoryChangePress}
                />
                <ListFilter
                    filters={filters}
                    reorderEnabled={reorderEnabled}
                    onFilterChange={this.onFilterChange}
                    onReorderPress={this.toggleReordering}
                />
                <NativeItem
                    account={account}
                    discreetMode={discreetMode}
                    reorderEnabled={reorderEnabled}
                    onPress={this.onNativeItemPress}
                />
                <SortableFlatList
                    ref={this.dragSortableRef}
                    itemHeight={TokenItem.Height}
                    dataSource={dataSource}
                    renderItem={this.renderItem}
                    renderEmptyList={this.renderEmptyList}
                    onItemPress={this.onTokenItemPress}
                    keyExtractor={this.keyExtractor}
                    onDataChange={this.onTokenReorder}
                    sortable={reorderEnabled}
                />
            </View>
        );
    }
}

export default TokensList;
