import Fuse from 'fuse.js';
import { flatMap, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { FlatList, InteractionManager, RefreshControl, View, ViewStyle } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { Navigator } from '@common/helpers/navigator';
import { AppConfig, AppScreens } from '@common/constants';
import { Toast } from '@common/helpers/interface';

import { TransactionTypes } from '@common/libs/ledger/types/enums';

import { AccountModel } from '@store/models';

import BackendService from '@services/BackendService';
import AccountService from '@services/AccountService';
import LedgerService from '@services/LedgerService';
import StyleService from '@services/StyleService';
import NetworkService from '@services/NetworkService';

import { LoadingIndicator, SearchBar } from '@components/General';

import { XAppOrigin } from '@common/libs/payload';

import { ListHeader } from '@components/Modules/AssetsList/NFTs/ListHeader';
import { NFTData, ListItem } from '@components/Modules/AssetsList/NFTs/ListItem';
import { ListEmpty } from '@components/Modules/AssetsList/NFTs/ListEmpty';

import Localize from '@locale';

import { Props as XAppBrowserModalProps } from '@screens/Modal/XAppBrowser/types';

import { AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    style?: ViewStyle | ViewStyle[];
    account: AccountModel;
    discreetMode: boolean;
    spendable: boolean;
    onChangeCategoryPress: () => void;
}

interface State {
    nfts: NFTData[];
    dataSource: NFTData[];
    filterText?: string;
    isLoading: boolean;
    isRefreshing: boolean;
}

/* Component ==================================================================== */
class NFTsList extends Component<Props, State> {
    private readonly searchInputRef: React.RefObject<SearchBar>;

    constructor(props: Props) {
        super(props);

        this.state = {
            nfts: [],
            dataSource: [],
            filterText: undefined,
            isLoading: true,
            isRefreshing: false,
        };

        this.searchInputRef = React.createRef();
    }

    componentDidMount() {
        // fetch NFTokens
        InteractionManager.runAfterInteractions(this.fetchNFTokens);

        // list of ledger transaction
        AccountService.on('transaction', this.onTransactionReceived);

        // listen for network switch
        NetworkService.on('networkChange', this.onNetworkChange);
    }

    componentWillUnmount() {
        // remove listeners
        AccountService.off('transaction', this.onTransactionReceived);
        NetworkService.off('networkChange', this.onNetworkChange);
    }

    onNetworkChange = () => {
        InteractionManager.runAfterInteractions(this.fetchNFTokens);
    };

    onTransactionReceived = (transaction: any, effectedAccounts: Array<string>) => {
        const { account } = this.props;

        // update the list if we received one of the transactions associated with NFTs including NFToken and URIToken
        if (account?.isValid() && effectedAccounts.includes(account.address)) {
            const { TransactionType } = transaction;
            if (
                [
                    TransactionTypes.NFTokenMint,
                    TransactionTypes.NFTokenBurn,
                    TransactionTypes.NFTokenCreateOffer,
                    TransactionTypes.NFTokenAcceptOffer,
                    TransactionTypes.NFTokenCancelOffer,
                    TransactionTypes.URITokenMint,
                    TransactionTypes.URITokenBurn,
                    TransactionTypes.URITokenCreateSellOffer,
                    TransactionTypes.URITokenCancelSellOffer,
                    TransactionTypes.URITokenBuy,
                ].includes(TransactionType)
            ) {
                this.fetchNFTokens();
            }
        }
    };

    fetchNFTokens = async (isRefreshing = false) => {
        const { account } = this.props;

        this.setState({
            [isRefreshing ? 'isRefreshing' : 'isLoading']: true,
        } as unknown as Pick<State, keyof State>);

        let nftIds: string[] | undefined;

        // fetch account NFTokens from ledger
        await LedgerService.getAccountNFTs(account.address)
            .then((items) => {
                nftIds = items.map((item) => ('NFTokenID' in item ? item.NFTokenID : item.index));
            })
            .catch(() => {
                Toast(Localize.t('account.unableToFetchAccountNFTokens'));
            });

        // an error happened
        if (typeof nftIds === 'undefined') {
            return;
        }

        // temporary set the list as we are fetching the details we can show a placeholder
        const tempNFTokens = flatMap(nftIds, (n) => {
            return { token: n };
        });

        this.setState({
            nfts: tempNFTokens,
            dataSource: tempNFTokens,
            [isRefreshing ? 'isRefreshing' : 'isLoading']: false,
        } as unknown as Pick<State, keyof State>);

        // account doesn't have any token
        if (isEmpty(nftIds)) {
            return;
        }

        // load the token details from backend and update the list
        BackendService.getNFTDetails(account.address, nftIds)
            .then((details) => {
                const { tokenData } = details;

                const nfts = flatMap(tokenData, (data) => {
                    return data;
                });

                this.setState({
                    nfts,
                    dataSource: nfts,
                });
            })
            .catch(() => {
                // ignore
            });
    };

    onRefresh = () => {
        this.fetchNFTokens(true);
    };

    onCategoryChangePress = () => {
        const { onChangeCategoryPress } = this.props;

        if (typeof onChangeCategoryPress === 'function') {
            onChangeCategoryPress();
        }
    };

    onSearchClearButtonPress = () => {
        if (this.searchInputRef.current) {
            this.searchInputRef.current.blur();
        }
    };

    onFilterTextChange = (filterText: string) => {
        this.setState(
            {
                filterText,
            },
            this.onFilterChange,
        );
    };

    onFilterChange = () => {
        const { filterText, nfts } = this.state;

        if (!filterText) {
            this.setState({
                dataSource: nfts,
            });
            return;
        }

        const tokensFilter = new Fuse(nfts, {
            keys: ['issuer', 'name', 'token'],
            shouldSort: false,
            includeScore: false,
        });

        const newDataSource = flatMap(tokensFilter.search(filterText), 'item') as any;

        this.setState({
            dataSource: newDataSource,
        });
    };

    onNFTItemPress = (item: NFTData) => {
        const { token } = item;

        Navigator.showModal<XAppBrowserModalProps>(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: AppConfig.xappIdentifiers.nftInfo,
                params: {
                    token,
                },
                origin: XAppOrigin.XUMM,
            },
            {
                modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
            },
        );
    };

    renderItem = ({ item, index }: { item: NFTData; index: number }) => {
        const { discreetMode } = this.props;
        const { nfts } = this.state;

        const { token, name, image, issuer } = item;

        return (
            <ListItem
                index={index}
                token={token}
                name={name}
                image={image}
                issuer={issuer}
                discreetMode={discreetMode}
                totalTokens={nfts.length}
                onPress={this.onNFTItemPress}
            />
        );
    };

    renderEmptyList = () => {
        const { isLoading } = this.state;

        if (isLoading) {
            return <LoadingIndicator style={styles.loadingContainer} />;
        }

        return <ListEmpty />;
    };

    keyExtractor = (item: NFTData) => {
        return `nfToken-${item.token}`;
    };

    render() {
        const { style } = this.props;
        const { dataSource, isRefreshing } = this.state;

        return (
            <View testID="nft-list-container" style={style}>
                <ListHeader onTitlePress={this.onCategoryChangePress} />
                <SearchBar
                    ref={this.searchInputRef}
                    height={AppSizes.heightPercentageToDP(4.5)}
                    onChangeText={this.onFilterTextChange}
                    onClearButtonPress={this.onSearchClearButtonPress}
                    placeholder={Localize.t('global.filter')}
                    containerStyle={styles.searchBarContainer}
                    inputStyle={styles.searchBarInput}
                    iconStyle={styles.searchBarIcon}
                    clearButtonVisibility="focus"
                    iconSize={15}
                    border
                />
                <FlatList
                    data={dataSource}
                    renderItem={this.renderItem}
                    ListEmptyComponent={this.renderEmptyList}
                    keyExtractor={this.keyExtractor}
                    indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={this.onRefresh}
                            tintColor={StyleService.value('$contrast')}
                        />
                    }
                />
            </View>
        );
    }
}

export default NFTsList;
