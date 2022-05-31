import { map, toLower, filter, sortBy, isEqual, has, findIndex } from 'lodash';
import React, { Component } from 'react';
import { View, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { Navigator } from '@common/helpers/navigator';

import { TrustLineRepository } from '@store/repositories';
import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { TokenItem } from '@components/Modules/TokenList/TokenItem';
import { NativeItem } from '@components/Modules/TokenList/NativeItem';
import { ListHeader } from '@components/Modules/TokenList/ListHeader';
import { ListEmpty } from '@components/Modules/TokenList/ListEmpty';
import { ListFilter, FiltersType } from '@components/Modules/TokenList/ListFilter';

import { SortableFlatList } from '@components/General';

/* Types ==================================================================== */
interface Props {
    timestamp?: number;
    testID?: string;
    style: ViewStyle | ViewStyle[];
    account: AccountSchema;
    discreetMode: boolean;
    readonly?: boolean;
    onTokenPress: (token: TrustLineSchema) => void;
}

interface State {
    account: AccountSchema;
    tokens: TrustLineSchema[];
    dataSource: TrustLineSchema[];
    filters: FiltersType;
    reorderEnabled: boolean;
}

/* Component ==================================================================== */
class TokenList extends Component<Props, State> {
    private readonly dragSortableRef: React.RefObject<SortableFlatList>;

    constructor(props: Props) {
        super(props);

        const tokens = props.account.lines.sorted([['order', false]]);

        this.state = {
            account: props.account,
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
        const { discreetMode, readonly, timestamp } = this.props;
        const { account, reorderEnabled, dataSource, filters } = this.state;

        return (
            !isEqual(nextProps.timestamp, timestamp) ||
            !isEqual(nextProps.readonly, readonly) ||
            !isEqual(nextProps.discreetMode, discreetMode) ||
            !isEqual(nextProps.account, account) ||
            !isEqual(nextState.reorderEnabled, reorderEnabled) ||
            !isEqual(nextState.filters, filters) ||
            !isEqual(map(nextState.dataSource, 'id').join(), map(dataSource, 'id').join())
        );
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State): Partial<State> {
        // on switch account or data update replace the dataSource and account
        // check if prev account is not valid anymore
        if (!prevState.account.isValid() || !isEqual(nextProps.account, prevState.account)) {
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
            const { filters } = filtersState;

            // update tokens and dataSource
            const tokens = nextProps.account.lines.sorted([['order', false]]);
            let dataSource = filters ? TokenList.getFilteredList(tokens, filters) : tokens;

            // if reorder already enabled, keep the sorting in the dataSource and update the list
            if (prevState.reorderEnabled) {
                dataSource = sortBy(dataSource, (o) => findIndex(prevState.dataSource, { id: o.id }));
            }

            return {
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

    onTokenItemPress = (token: TrustLineSchema) => {
        const { onTokenPress } = this.props;
        const { reorderEnabled } = this.state;

        // ignore if reordering is enabled
        if (reorderEnabled) {
            return;
        }

        if (onTokenPress && typeof onTokenPress === 'function') {
            onTokenPress(token);
        }
    };

    onAddButtonPress = () => {
        const { account } = this.state;
        Navigator.showOverlay(AppScreens.Overlay.AddCurrency, { account });
    };

    onExplainBalanceButtonPress = () => {
        const { account } = this.state;
        Navigator.showOverlay(AppScreens.Overlay.ExplainBalance, { account });
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
            dataSource: TokenList.getFilteredList(tokens, filters),
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
        const { timestamp, account, testID, style, readonly, discreetMode } = this.props;
        const { dataSource, reorderEnabled, filters } = this.state;

        return (
            <View testID={testID} style={style}>
                <ListHeader
                    reorderEnabled={reorderEnabled}
                    showAddButton={!readonly}
                    onReorderSavePress={this.saveTokensOrder}
                    onAddPress={this.onAddButtonPress}
                    onExplainPress={this.onExplainBalanceButtonPress}
                />
                <ListFilter
                    filters={filters}
                    reorderEnabled={reorderEnabled}
                    onFilterChange={this.onFilterChange}
                    onReorderPress={this.toggleReordering}
                />
                <NativeItem timestamp={timestamp} account={account} discreetMode={discreetMode} />
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

export default TokenList;
