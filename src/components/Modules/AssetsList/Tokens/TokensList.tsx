import { toLower, map, filter, sortBy, isEqual, has, findIndex } from 'lodash';
import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { StringIdentifier } from '@common/utils/string';

import { Navigator } from '@common/helpers/navigator';

import { TrustLineRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { SortableFlatList } from '@components/General';

import { TokenItem } from '@components/Modules/AssetsList/Tokens/TokenItem';
import { NativeItem } from '@components/Modules/AssetsList/Tokens/NativeItem';
import { ListHeader } from '@components/Modules/AssetsList/Tokens/ListHeader';
import { ListEmpty } from '@components/Modules/AssetsList/Tokens/ListEmpty';
import { ListFilter, FiltersType } from '@components/Modules/AssetsList/Tokens/ListFilter';

/* Types ==================================================================== */
interface Props {
    style?: ViewStyle | ViewStyle[];
    account: AccountSchema;
    discreetMode: boolean;
    spendable: boolean;

    onChangeCategoryPress: () => void;
}

interface State {
    accountStateHash: number;
    account: AccountSchema;
    tokens: TrustLineSchema[];
    dataSource: TrustLineSchema[];
    filters: FiltersType;
    reorderEnabled: boolean;
}

/* Component ==================================================================== */
class TokensList extends Component<Props, State> {
    private readonly dragSortableRef: React.RefObject<SortableFlatList>;

    constructor(props: Props) {
        super(props);

        const { account } = props;
        const tokens = account.lines.sorted([['order', false]]);
        const accountStateHash = TokensList.getAccountStateHash(account);

        this.state = {
            accountStateHash,
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
    }

    componentWillUnmount(): void {
        // remove trustLine update listener
        TrustLineRepository.off('trustLineUpdate', this.onTrustLineUpdate);
    }

    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        const { discreetMode, spendable } = this.props;
        const { dataSource, accountStateHash, reorderEnabled, filters } = this.state;

        return (
            !isEqual(nextProps.spendable, spendable) ||
            !isEqual(nextProps.discreetMode, discreetMode) ||
            !isEqual(nextState.accountStateHash, accountStateHash) ||
            !isEqual(nextState.reorderEnabled, reorderEnabled) ||
            !isEqual(nextState.filters, filters) ||
            !isEqual(map(nextState.dataSource, 'id').join(), map(dataSource, 'id').join())
        );
    }

    static getAccountStateHash = (account: AccountSchema): number => {
        const state = JSON.stringify(account.toJSON(), (key, val) => {
            if (val != null && typeof val === 'object' && ['owners', 'currency'].includes(key)) {
                return;
            }
            // eslint-disable-next-line consistent-return
            return val;
        });
        return StringIdentifier(state);
    };

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
        // calculate account state hash
        const accountStateHash = TokensList.getAccountStateHash(nextProps.account);

        // on switch account or data update replace the dataSource and account
        // check if prev account is not valid anymore
        if (!prevState.account.isValid() || !isEqual(accountStateHash, prevState.accountStateHash)) {
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
            const tokens = nextProps.account.lines.sorted([['order', false]]);
            let dataSource = filters ? TokensList.getFilteredList(tokens, filters) : tokens;

            // if reorder already enabled, keep the sorting in the dataSource and update the list
            if (reorderEnabled) {
                dataSource = sortBy(dataSource, (o) => findIndex(prevState.dataSource, { id: o.id }));
            }

            return {
                accountStateHash,
                account: nextProps.account,
                tokens,
                dataSource,
                ...filtersState,
            };
        }

        return null;
    }

    static getFilteredList = (tokens: TrustLineSchema[], filters: FiltersType): TrustLineSchema[] => {
        if (!filters) {
            return tokens;
        }

        // destruct filter variables
        const { text, favorite, hideZero } = filters;

        // default dataSource
        let filtered = tokens;

        // filter base on filter text
        if (text) {
            const normalizedSearch = toLower(text);

            filtered = filter(filtered, (item: TrustLineSchema) => {
                return (
                    toLower(item.currency.name).indexOf(normalizedSearch) > -1 ||
                    toLower(item.counterParty?.name).indexOf(normalizedSearch) > -1 ||
                    toLower(NormalizeCurrencyCode(item.currency.currency)).indexOf(normalizedSearch) > -1
                );
            });
        }

        // hide lines with zero balance
        if (hideZero) {
            filtered = filter(filtered, (item: TrustLineSchema) => {
                return item.balance !== 0;
            });
        }

        // only show favorite lines
        if (favorite) {
            filtered = filter(filtered, { favorite: true });
        }

        return filtered;
    };

    onTrustLineUpdate = (updatedToken: TrustLineSchema, changes: Partial<TrustLineSchema>) => {
        // update the token in the list if token favorite changed
        if (has(changes, 'favorite')) {
            this.forceUpdate();
        }
    };

    onTokenAddButtonPress = () => {
        const { account } = this.state;
        Navigator.showOverlay(AppScreens.Overlay.AddCurrency, { account });
    };

    onTokenItemPress = (token: TrustLineSchema) => {
        const { spendable } = this.props;
        const { account, reorderEnabled } = this.state;

        // ignore if reordering is enabled
        if (!token || reorderEnabled) {
            return;
        }

        if (spendable) {
            Navigator.showOverlay(
                AppScreens.Overlay.CurrencySettings,
                { trustLine: token, account },
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
        Navigator.showOverlay(AppScreens.Overlay.ExplainBalance, { account });
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

    onTokenReorder = (data: Array<TrustLineSchema>) => {
        this.setState({
            dataSource: data,
        });
    };

    onItemMoveTopPress = (token: TrustLineSchema) => {
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

    onFilterChange = (filters: FiltersType) => {
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

    renderItem = ({ item, index }: { item: TrustLineSchema; index: number }) => {
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

    keyExtractor = (item: TrustLineSchema) => {
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
