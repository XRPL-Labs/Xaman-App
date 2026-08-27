import { toLower, map, filter, sortBy, isEqual, has, findIndex } from 'lodash';
import React, { Component } from 'react';
import { InteractionManager, View, ViewStyle } from 'react-native';

import { AppScreens } from '@common/constants';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { Navigator } from '@common/helpers/navigator';

import { CoreRepository, CurrencyRepository, TrustLineRepository } from '@store/repositories';
import { AccountModel, NetworkModel, TrustLineModel } from '@store/models';

import { SortableFlatList } from '@components/General';

import { AddTokenOverlayProps } from '@screens/Overlay/AddToken';
import { ExplainBalanceOverlayProps } from '@screens/Overlay/ExplainBalance';
import { Props as TokenSettingsOverlayProps } from '@screens/Overlay/TokenSettings/types';

import { TokenItem } from '@components/Modules/AssetsList/Tokens/TokenItem';
import { NativeItem } from '@components/Modules/AssetsList/Tokens/NativeItem';
import { ListHeader } from '@components/Modules/AssetsList/Tokens/ListHeader';
import { ListEmpty } from '@components/Modules/AssetsList/Tokens/ListEmpty';
import { FiltersType } from '@components/Modules/AssetsList/Tokens/ListFilter';
import {
    AppSizes,
    // AppStyles,
} from '@theme/index';
import NetworkService from '@services/NetworkService';
import { ASSETS_CATEGORY } from '@screens/Overlay/SwitchAssetCategory/types';

import BigNumber from 'bignumber.js';
import { type XAppBrowserModalProps } from '@screens/Modal/XAppBrowser';
import { XAppOrigin } from '@common/libs/payload';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';
import { TokenAvatar } from '@components/Modules/TokenElement';
import AccountService from '@services/AccountService';

/* Types ==================================================================== */
interface Props {
    style?: ViewStyle | ViewStyle[];
    account: AccountModel;
    discreetMode: boolean;
    spendable: boolean;
    experimentalUI?: boolean;
    onChangeCategoryPress: (selectedCategory?: ASSETS_CATEGORY) => void;
    network?: NetworkModel;
    addTokenPress?: () => void;
    hideTopElements: (toggle: boolean) => void;
}

interface State {
    accountStateVersion: number;
    lineWorthLoading?: boolean;
    account: AccountModel;
    tokens: TrustLineModel[];
    dataSource: TrustLineModel[];
    filters?: FiltersType;
    reorderEnabled: boolean;
    showHeader: boolean;
    accWorthEnabled: boolean;
    assetPricesInList: boolean;
    tokenPrices: {
        totalValue: number;
        live: boolean;
        lineItems: {
            issuer: string;
            asset: string;
            value: number;
            rate: number;
            amount: number;
            isAMM: boolean;
        }[];
        rate: {
            code: string;
            rate: number;
            symbol: string;
            lastSync: number;
        };
    };
}

/* Component ==================================================================== */
class TokensList extends Component<Props, State> {
    private readonly dragSortableRef: React.RefObject<SortableFlatList>;

    constructor(props: Props) {
        super(props);

        const { account } = props;
        const tokens = (account.lines?.sorted([['order', false]]) as TrustLineModel[] | undefined) ?? [];

        const settings = CoreRepository.getSettings();

        const isValidNetwork = settings.network?.key === 'MAINNET' || settings.network?.key === 'XAHAU';
        const accWorthContext = !settings.discreetMode && isValidNetwork;

        this.state = {
            accountStateVersion: account.getStateVersion(),
            account,
            tokens,
            dataSource: tokens,
            filters: undefined,
            reorderEnabled: false,
            // eslint-disable-next-line react/no-unused-state
            lineWorthLoading: true,
            showHeader: true,
            accWorthEnabled: settings.accountWorthActive && accWorthContext,
            assetPricesInList: settings.showPerAssetWorth && accWorthContext,
            tokenPrices: {
                totalValue: 0,
                live: false,
                lineItems: [],
                rate: {
                    code: '',
                    rate: 0,
                    symbol: '',
                    lastSync: 0,
                },
            },
        };
        
        this.dragSortableRef = React.createRef();
    }

    updateSettingsHandler = () => {
        const settings = CoreRepository.getSettings();
        // Todo: fetch new value
        const validContext = !settings.discreetMode && (
            settings.network?.key === 'MAINNET' ||
            settings.network?.key === 'XAHAU'
        );
        this.setState({
            accWorthEnabled: settings.accountWorthActive && validContext,
            assetPricesInList: settings.showPerAssetWorth && validContext,
        });
    };

    componentDidMount(): void {
        // listen for token updates
        // this is needed when a single token favorite status changed
        TrustLineRepository.on('trustLineUpdate', this.onTrustLineUpdate);
        // this is needed when using ResolveService to sync the currency details
        CurrencyRepository.on('currencyDetailsUpdate', this.onCurrencyDetailsUpdate);

        InteractionManager.runAfterInteractions(() => { 
            const settings = CoreRepository.getSettings();
            const validContext = !settings.discreetMode && (
                settings.network?.key === 'MAINNET' ||
                settings.network?.key === 'XAHAU'
            );
            this.setState({
                accWorthEnabled: settings.accountWorthActive && validContext,
            });
            CoreRepository.on('updateSettings', this.updateSettingsHandler);

            if (settings.filterHideZeroValue) {
                this.onFilterChange({
                    favorite: false,
                    hideZero: settings.filterHideZeroValue,
                    text: '',
                });
            }
        });
    }

    componentWillUnmount(): void {
        // remove trustLine update listener
        TrustLineRepository.off('trustLineUpdate', this.onTrustLineUpdate);
        // remove listener
        CurrencyRepository.off('currencyDetailsUpdate', this.onCurrencyDetailsUpdate);

        CoreRepository.off('updateSettings', this.updateSettingsHandler);
    }

    shouldComponentUpdate(nextProps: Props, nextState: State): boolean {
        const { discreetMode, spendable, experimentalUI, network } = this.props;
        const {
            dataSource,
            accountStateVersion,
            reorderEnabled,
            filters,
            showHeader,
            accWorthEnabled,
            assetPricesInList,
            tokenPrices,
        } = this.state;

        if (nextState && nextProps) {
            try {
                return (
                    !isEqual(nextState.tokenPrices, tokenPrices) ||
                    !isEqual(nextState.accWorthEnabled, accWorthEnabled) ||
                    !isEqual(nextState.assetPricesInList, assetPricesInList) ||
                    !isEqual(nextState.showHeader, showHeader) ||
                    !isEqual(nextProps.spendable, spendable) ||
                    !isEqual(nextProps.network, network) ||
                    !isEqual(nextProps.discreetMode, discreetMode) ||
                    !isEqual(nextProps.experimentalUI, experimentalUI) ||
                    !isEqual(nextState.accountStateVersion, accountStateVersion) ||
                    !isEqual(nextState.reorderEnabled, reorderEnabled) ||
                    !isEqual(nextState.filters, filters) ||
                    !isEqual(map(nextState.dataSource, 'id').join(), map(dataSource, 'id').join())
                );
            } catch (e) {
                // console.log('error in shouldComponentUpdate', e);
                return false;
            }
        }

        // console.log('do not update because: ', nextState, nextProps);
        return false;
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
                const settings = CoreRepository.getSettings();

                filtersState = {
                    filters: settings.filterHideZeroValue ? {
                        favorite: false,
                        hideZero: settings.filterHideZeroValue,
                        text: '',
                    } : undefined,
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
        const { addTokenPress } = this.props;

        if (NetworkService.hasSwap() && addTokenPress) {
            addTokenPress();
            return;
        }

        Navigator.showOverlay<AddTokenOverlayProps>(AppScreens.Overlay.AddToken, { account });
    };

    onTokenItemPress = (token: TrustLineModel) => {
        const { spendable } = this.props;
        const { account, reorderEnabled } = this.state;

        // ignore if reordering is enabled
        if (!token || reorderEnabled || token?.id === 'native') {
            return;
        }

        if (token.isExternalAsset()) {
            try {
                const externalTokenInfo = JSON.parse(String(token.limit_peer).split('|')?.[1]);
                const identifier = externalTokenInfo?.xApp;
                const title = externalTokenInfo?.title || token.getFormattedCurrency();
                const subtitle = externalTokenInfo?.subtitle || token.currency.issuer;

                if (identifier && title && subtitle) {
                    Navigator.showModal<XAppBrowserModalProps>(
                        AppScreens.Modal.XAppBrowser,
                        {
                            identifier,
                            onClose: () => {
                                AccountService.updateAccountInfo(account.address);
                            },
                            containerStyle: {
                                marginTop: 0,
                            },
                            noSwitching: true,
                            altHeader: {
                                left: {
                                    // icon: 'IconChevronLeft',
                                    onPress: 'onClose',
                                    element: (
                                        <View>
                                            <TokenAvatar
                                                token={token}
                                                // border
                                                size={35}
                                            />
                                        </View>
                                    ),
                                },
                                center: {
                                    text: title,
                                    subtitle,
                                    // showNetworkLabel: true,
                                },
                                right: {
                                    onPress: 'onClose',
                                    icon: 'IconX',
                                    iconSize: 20,
                                },
                            },
                            origin: XAppOrigin.XUMM,
                            params: {
                                issuer: token.currency.issuer,
                                asset: token.currency.currencyCode,
                                action: 'SETTINGS',
                            },
                        },
                        {
                            modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                            modalPresentationStyle: OptionsModalPresentationStyle.pageSheet,
                        },
                    );
                }
            } catch {
                // Ignore
            }

            return;
        }

        if (spendable) {
            Navigator.showOverlay<TokenSettingsOverlayProps>(
                AppScreens.Overlay.TokenSettings,
                { token, account },
                {
                    overlay: {
                        interceptTouchOutside: false,
                        //     ^^  Needed for tapping backdrop = close, uses onTouchStart={this.startTouch}
                    },
                },
            );
        }
    };

    onNativeItemPress = () => {
        const { account } = this.state;
        Navigator.showOverlay<ExplainBalanceOverlayProps>(AppScreens.Overlay.ExplainBalance, { account });
    };

    onCategoryChangePress = (selectedCategory?: ASSETS_CATEGORY) => {
        const { onChangeCategoryPress } = this.props;

        if (typeof onChangeCategoryPress === 'function') {
            onChangeCategoryPress(selectedCategory);
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

    getTokenPrice = (tokenPrices: typeof this.state.tokenPrices, token: TrustLineModel | 'native') => {
        const { account } = this.state;

        // if (lineWorthLoading) {
        //     return '0';
        // }

        const i = token === 'native' ? {
            currency: {
                issuer: 'rrrrrrrrrrrrrrrrrrrrrrrhoLvTp',
                currencyCode: 'XRP',
            },
            balance: account.balance,
        } : token;

        const tokenValue = tokenPrices.lineItems
            .find((x) => {
                return x.issuer === i.currency.issuer && x.asset === i.currency.currencyCode;
            })?.rate;
        
        return tokenValue
            ? String(new BigNumber(tokenValue).multipliedBy(i.balance).decimalPlaces(2).toNumber())
            : '0';
    };

    renderItem = ({ item, index }: { item: TrustLineModel; index: number }) => {
        const { discreetMode, experimentalUI, network } = this.props;
        const {
            account,
            reorderEnabled,
            assetPricesInList,
            tokenPrices,
        } = this.state;

        const asset = tokenPrices.rate.symbol && tokenPrices.rate.symbol !== ''
            ? `${tokenPrices.rate.symbol} `
            : '';
        
        if (item?.id === 'native') {
            return (
                <NativeItem
                    key={`nativeasset-${network?.key}`}
                    account={account}
                    amountInline={assetPricesInList}
                    discreetMode={discreetMode}
                    subPrice={assetPricesInList ? this.getTokenPrice(tokenPrices, 'native') : undefined}
                    subPrefix={asset}
                    reorderEnabled={reorderEnabled}
                    onPress={this.onNativeItemPress}
                />
            );
        }

        return (
            <TokenItem
                index={index}
                token={item}
                reorderEnabled={reorderEnabled}
                discreetMode={discreetMode}
                subPrice={assetPricesInList ? this.getTokenPrice(tokenPrices, item) : undefined}
                subPrefix={asset}
                saturate={experimentalUI}
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

        return <ListEmpty onTokenAddButtonPress={this.onTokenAddButtonPress} />;
    };

    keyExtractor = (item: TrustLineModel) => {
        return `token-${item.id}`;
    };

    hideTopElements = (state: boolean) => {
        const { hideTopElements } = this.props;

        this.setState({
            showHeader: !state,
        }, () => {
            if (hideTopElements) {
                hideTopElements(state);
            }
        });
    };

    updateTokenPrices = (prices: typeof this.state.tokenPrices) => {
        if (typeof prices === 'object' && typeof prices?.totalValue === 'number') {
            this.setState({
                tokenPrices: prices,
            });
        }
    };

    updateLineWorthLoading = (loading: boolean) => {
        this.setState({
            // eslint-disable-next-line react/no-unused-state
            lineWorthLoading: loading,
        });
    };

    render() {
        const {
            account,
            style,
            spendable,
            discreetMode,
            experimentalUI,
            network,
        } = this.props;
        const {
            dataSource,
            reorderEnabled,
            filters,
            showHeader,
            accWorthEnabled,
        } = this.state;

        return (
            <View key={`tokenlist-${!!accWorthEnabled}`} testID="token-list-container" style={style}>
                {showHeader && (
                    <ListHeader
                        reorderEnabled={reorderEnabled}
                        showTokenAddButton={spendable}
                        onReorderSavePress={this.saveTokensOrder}
                        onTokenAddPress={this.onTokenAddButtonPress}
                        onTitlePress={this.onCategoryChangePress}
                        hideTopElements={this.hideTopElements}
                        visible={!(typeof experimentalUI !== 'undefined' && !experimentalUI && AppSizes.scale(41))}
                        filters={filters}
                        onFilterChange={this.onFilterChange}
                        onReorderPress={this.toggleReordering}
                    />
                )}
                {/* { !reorderEnabled && (
                    <View style={{height: AppSizes.scale(41)}}>
                        <ListFilter
                            filters={filters}
                            visible={typeof experimentalUI !== 'undefined' && !experimentalUI}
                            onFilterChange={this.onFilterChange}
                            onReorderPress={this.toggleReordering}
                        />
                    </View>
                )} */}
                { reorderEnabled && (
                    <NativeItem
                        key={`nativeasset-${network?.key}`}
                        account={account}
                        network={network}
                        discreetMode={discreetMode}
                        reorderEnabled={reorderEnabled}
                        onPress={this.onNativeItemPress}
                    />
                )}
                <SortableFlatList
                    key={`tokenlistflat-${accWorthEnabled ? 1 : 0}`}
                    ref={this.dragSortableRef}
                    itemHeight={TokenItem.Height}
                    separatorHeight={0}
                    topFade
                    updateTokenPrices={this.updateTokenPrices}
                    lineWorthLoading={this.updateLineWorthLoading}
                    accWorthEnabled={accWorthEnabled}
                    firstItemExtraHeight={reorderEnabled ? 0 : AppSizes.scale(12) + (accWorthEnabled ? 65 : 0)}
                    dataSource={[
                        ...(reorderEnabled ? [] : [{
                            id: 'native',
                            currency: {
                                issuer: '',
                            },
                            getFormattedCurrency: () => NetworkService.getNativeAsset(),
                            isLiquidityPoolToken: () => false,
                            isMPToken: () => false,
                            getFormattedIssuer: () => '',
                            getLpAssetPair: () => [],
                        }]),
                        ...dataSource,
                    ]}
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
