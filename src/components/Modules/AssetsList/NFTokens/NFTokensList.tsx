import Fuse from 'fuse.js';
import { flatMap, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { FlatList, InteractionManager, RefreshControl, View, ViewStyle } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { Navigator } from '@common/helpers/navigator';
import { AppScreens } from '@common/constants';
import { Toast } from '@common/helpers/interface';

import { TransactionTypes } from '@common/libs/ledger/types';

import { AccountModel } from '@store/models';

import BackendService from '@services/BackendService';
import AccountService from '@services/AccountService';
import LedgerService from '@services/LedgerService';
import StyleService from '@services/StyleService';

import { LoadingIndicator, SearchBar } from '@components/General';

import { XAppOrigin } from '@common/libs/payload';

import { ListHeader } from '@components/Modules/AssetsList/NFTokens/ListHeader';
import { NFTokenData, NFTokenItem } from '@components/Modules/AssetsList/NFTokens/NFTokenItem';
import { ListEmpty } from '@components/Modules/AssetsList/NFTokens/ListEmpty';

import Localize from '@locale';

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
    nfTokens: NFTokenData[];
    dataSource: NFTokenData[];
    filterText: string;
    isLoading: boolean;
    isRefreshing: boolean;
}

/* Component ==================================================================== */
class NFTokensList extends Component<Props, State> {
    private readonly searchInputRef: React.RefObject<SearchBar | null>;

    constructor(props: Props) {
        super(props);

        this.state = {
            nfTokens: [],
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
    }

    componentWillUnmount() {
        // remove listeners
        AccountService.off('transaction', this.onTransactionReceived);
    }

    onTransactionReceived = (transaction: any, effectedAccounts: Array<string>) => {
        const { account } = this.props;

        // update the list if
        if (account?.isValid() && effectedAccounts.includes(account.address)) {
            const { TransactionType } = transaction;
            if (
                [
                    TransactionTypes.NFTokenMint,
                    TransactionTypes.NFTokenBurn,
                    TransactionTypes.NFTokenCreateOffer,
                    TransactionTypes.NFTokenAcceptOffer,
                    TransactionTypes.NFTokenCancelOffer,
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

        let nfTokenIds = undefined as string[];

        // fetch account NFTokens from ledger
        await LedgerService.getAccountNFTs(account.address)
            .then((nfTokens) => {
                nfTokenIds = flatMap(nfTokens, 'NFTokenID');
            })
            .catch(() => {
                Toast(Localize.t('account.unableToFetchAccountNFTokens'));
            });

        // an error happened
        if (typeof nfTokenIds === 'undefined') {
            return;
        }

        // temporary set the list as we are fetching the details we can show a placeholder

        const tempNFTokens = flatMap(nfTokenIds, (n) => {
            return { token: n };
        });

        this.setState({
            nfTokens: tempNFTokens,
            dataSource: tempNFTokens,
            [isRefreshing ? 'isRefreshing' : 'isLoading']: false,
        } as unknown as Pick<State, keyof State>);

        // account doesn't have any token
        if (isEmpty(nfTokenIds)) {
            return;
        }

        // load the token details from backend and update the list
        BackendService.getXLS20Details(account.address, nfTokenIds)
            .then((details: any) => {
                const { tokenData } = details;

                const nfTokens = flatMap(tokenData, (data) => {
                    return data;
                });

                this.setState({
                    nfTokens,
                    dataSource: nfTokens,
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
        const { filterText, nfTokens } = this.state;

        if (!filterText) {
            this.setState({
                dataSource: nfTokens,
            });
            return;
        }

        const tokensFilter = new Fuse(nfTokens, {
            keys: ['issuer', 'name', 'token'],
            shouldSort: false,
            includeScore: false,
        });

        const newDataSource = flatMap(tokensFilter.search(filterText), 'item') as any;

        this.setState({
            dataSource: newDataSource,
        });
    };

    onNFTItemPress = (item: NFTokenData) => {
        const { token } = item;

        Navigator.showModal(
            AppScreens.Modal.XAppBrowser,
            {
                identifier: 'xumm.nft-info',
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

    renderItem = ({ item, index }: { item: NFTokenData; index: number }) => {
        const { discreetMode } = this.props;
        const { nfTokens } = this.state;

        const { token, name, image, issuer } = item;

        return (
            <NFTokenItem
                index={index}
                token={token}
                name={name}
                image={image}
                issuer={issuer}
                discreetMode={discreetMode}
                totalTokens={nfTokens.length}
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

    keyExtractor = (item: NFTokenData) => {
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

export default NFTokensList;
