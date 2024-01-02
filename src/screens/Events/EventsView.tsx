/**
 * Events Screen
 */
import Fuse from 'fuse.js';
import moment from 'moment-timezone';
import {
    has,
    filter,
    flatMap,
    get,
    groupBy,
    isEmpty,
    isEqual,
    isUndefined,
    map,
    orderBy,
    uniqBy,
    without,
} from 'lodash';
import React, { Component } from 'react';
import { Image, ImageBackground, InteractionManager, Text, View } from 'react-native';

import { Navigation, EventSubscription } from 'react-native-navigation';

import { CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel } from '@store/models';

// Constants/Helpers
import { AppScreens } from '@common/constants';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

// Parses
import { LedgerObjectFactory, TransactionFactory } from '@common/libs/ledger/factory';
import { LedgerEntriesTypes, LedgerMarker, LedgerObjectTypes, TransactionTypes } from '@common/libs/ledger/types';
import { Transactions } from '@common/libs/ledger/transactions/types';
import { NFTokenOffer } from '@common/libs/ledger/objects';
import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { Payload } from '@common/libs/payload';

// types
import { FilterProps } from '@screens/Modal/FilterEvents/EventsFilterView';

// Services
import {
    AccountService,
    AppService,
    BackendService,
    LedgerService,
    PushNotificationsService,
    StyleService,
} from '@services';
import { AppStateStatus } from '@services/AppService';

// Components
import { Button, Header, SearchBar, SegmentButton } from '@components/General';
import { EventsFilterChip, EventsList } from '@components/Modules';

import { DataSourceItem, DataSourceItemType } from '@components/Modules/EventsList/EventsList';

// Locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    timestamp?: number;
}

export interface State {
    isLoading: boolean;
    isLoadingMore: boolean;
    canLoadMore: boolean;
    filters: FilterProps;
    searchText: string;
    sectionIndex: number;
    lastMarker: LedgerMarker;
    account: AccountModel;
    transactions: Array<Transactions>;
    plannedTransactions: Array<LedgerObjects>;
    pendingRequests: Array<Payload | NFTokenOffer>;
    dataSource: Array<DataSourceItem>;
}

enum DataSourceType {
    PLANNED_TRANSACTIONS = 'PLANNED_TRANSACTIONS',
    TRANSACTIONS = 'TRANSACTIONS',
    PENDING_REQUESTS = 'PENDING_REQUESTS',
}

/* Component ==================================================================== */
class EventsView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Events;

    private forceReload: boolean;
    private isScreenVisible: boolean;
    private navigationListener: EventSubscription;

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
            isLoading: true,
            isLoadingMore: false,
            canLoadMore: true,
            searchText: undefined,
            filters: undefined,
            sectionIndex: 0,
            lastMarker: undefined,
            account: CoreRepository.getDefaultAccount(),
            transactions: [],
            pendingRequests: [],
            plannedTransactions: [],
            dataSource: [],
        };

        this.forceReload = false;
        this.isScreenVisible = false;
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { dataSource, account, isLoading, canLoadMore, isLoadingMore, filters } = this.state;
        const { timestamp } = this.props;

        return (
            !isEqual(nextState.dataSource, dataSource) ||
            !isEqual(nextState.isLoading, isLoading) ||
            !isEqual(nextState.isLoadingMore, isLoadingMore) ||
            !isEqual(nextState.canLoadMore, canLoadMore) ||
            !isEqual(nextState.account, account) ||
            !isEqual(nextState.filters, filters) ||
            !isEqual(nextProps.timestamp, timestamp)
        );
    }

    componentDidAppear() {
        // keep track of screen visibility
        this.isScreenVisible = true;

        // check if we need to reload the screen
        if (this.forceReload) {
            // set the flag to false
            this.forceReload = false;

            // reload the state
            this.reloadState();
        }
    }

    componentDidDisappear() {
        // keep track of screen visibility
        this.isScreenVisible = false;
    }

    componentDidMount() {
        // componentDidDisappear event
        this.navigationListener = Navigation.events().bindComponent(this);

        // add listener for default account change
        CoreRepository.on('updateSettings', this.onCoreSettingsUpdate);
        // update list on transaction received
        AccountService.on('transaction', this.onTransactionReceived);
        // update list on sign request received
        PushNotificationsService.on('signRequestUpdate', this.onSignRequestReceived);
        // update the payload list when coming from background
        AppService.on('appStateChange', this.onAppStateChange);

        // update data source after component mount
        InteractionManager.runAfterInteractions(this.updateDataSource);
    }

    componentWillUnmount() {
        // remove listeners
        CoreRepository.off('updateSettings', this.onCoreSettingsUpdate);
        AccountService.off('transaction', this.onTransactionReceived);
        PushNotificationsService.off('signRequestUpdate', this.onSignRequestReceived);
        AppService.off('appStateChange', this.onAppStateChange);

        if (this.navigationListener) {
            this.navigationListener.remove();
        }
    }

    reloadState = () => {
        // reset everything and load transaction
        this.setState(
            {
                account: CoreRepository.getDefaultAccount(),
                dataSource: [],
                transactions: [],
                plannedTransactions: [],
                lastMarker: undefined,
                canLoadMore: true,
            },
            this.updateDataSource,
        );
    };

    onCoreSettingsUpdate = (_coreSettings: CoreModel, changes: Partial<CoreModel>) => {
        // force reload if network or default account changed
        if (has(changes, 'network') || has(changes, 'account')) {
            this.forceReload = true;

            // in some cases account can be switched when event list is visible,
            // we need to force reload without relying on componentDidAppear event
            if (this.isScreenVisible) {
                InteractionManager.runAfterInteractions(this.reloadState);
            }
        }
    };

    onSignRequestReceived = () => {
        const { account, sectionIndex } = this.state;

        if (account?.isValid() && (sectionIndex === 0 || sectionIndex === 2)) {
            this.updateDataSource([DataSourceType.PENDING_REQUESTS]);
        }
    };

    onTransactionReceived = (_transaction: any, effectedAccounts: Array<string>) => {
        const { account } = this.state;

        if (account?.isValid()) {
            if (effectedAccounts.includes(account.address)) {
                this.updateDataSource([DataSourceType.TRANSACTIONS, DataSourceType.PLANNED_TRANSACTIONS]);
            }
        }
    };

    onAppStateChange = (status: AppStateStatus, prevStatus: AppStateStatus) => {
        if (
            status === AppStateStatus.Active &&
            [AppStateStatus.Background, AppStateStatus.Inactive].includes(prevStatus)
        ) {
            this.onSignRequestReceived();
        }
    };

    formatDate = (date: string) => {
        const momentDate = moment(date);
        const reference = moment();

        if (momentDate.isSame(reference, 'day')) {
            return Localize.t('global.today');
        }
        if (momentDate.isSame(reference.subtract(1, 'days'), 'day')) {
            return Localize.t('global.yesterday');
        }

        // same year, don't show year
        if (momentDate.isSame(reference, 'year')) {
            return momentDate.format('DD MMM');
        }

        return momentDate.format('DD MMM, Y');
    };

    fetchPlannedObjects = async (
        account: string,
        type: string,
        marker?: string,
        combined = [] as LedgerEntriesTypes[],
    ): Promise<LedgerEntriesTypes[]> => {
        return LedgerService.getAccountObjects(account, { type, marker }).then((resp) => {
            const { error, account_objects, marker: _marker } = resp;
            // account is not found
            if (error && error === 'actNotFound') {
                return [];
            }
            if (_marker && _marker !== marker) {
                return this.fetchPlannedObjects(account, type, _marker, account_objects.concat(combined));
            }
            return account_objects.concat(combined);
        });
    };

    loadPlannedTransactions = () => {
        const { account } = this.state;

        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve) => {
            // return if no account exist
            if (!account) {
                resolve([]);
                return;
            }

            // account objects we are interested in
            const objectTypes = ['check', 'escrow', 'offer', 'nft_offer', 'ticket', 'payment_channel'];
            let objects = [] as LedgerEntriesTypes[];

            objectTypes
                .reduce(async (accumulator, type) => {
                    return accumulator.then(async () => {
                        return this.fetchPlannedObjects(account.address, type).then((res) => {
                            if (res) {
                                objects = [...objects, ...res];
                            } else {
                                objects = [...objects];
                            }
                        });
                    });
                }, Promise.resolve())
                .then(() => {
                    const parsedList = flatMap(objects, LedgerObjectFactory.fromLedger);
                    const filtered = without(parsedList, null);

                    this.setState({ plannedTransactions: filtered }, () => {
                        resolve(filtered);
                    });
                })
                .catch(() => {
                    Toast(Localize.t('events.canNotFetchTransactions'));
                    resolve([]);
                });
        });
    };

    loadPendingRequests = () => {
        const { account, sectionIndex } = this.state;

        return new Promise((resolve) => {
            const promises = [BackendService.getPendingPayloads()] as any;

            // only load XLS20 offers on requests section
            if (sectionIndex === 2) {
                promises.push(BackendService.getXLS20Offered(account.address));
            }

            Promise.all(promises).then((result) => {
                const combined = [].concat(...result);
                this.setState({ pendingRequests: combined }, () => {
                    resolve(combined);
                });
            });
        });
    };

    loadTransactions = (loadMore?: boolean): Promise<Transactions[]> => {
        const { transactions, account, lastMarker } = this.state;

        return new Promise((resolve) => {
            // return if no account exist
            if (!account) {
                resolve([]);
                return;
            }

            LedgerService.getTransactions(account.address, loadMore && lastMarker, 50)
                .then((resp) => {
                    const { transactions: txResp, marker } = resp;
                    let canLoadMore = true;

                    // if we got less than 50 transaction, means there is no transaction
                    // also only handle recent 1000 transactions
                    if (txResp.length < 50 || transactions.length >= 1000) {
                        canLoadMore = false;
                    }

                    let parsedList = filter(flatMap(txResp, TransactionFactory.fromLedger), (t) => {
                        return t?.TransactionResult?.success;
                    });

                    if (loadMore) {
                        parsedList = uniqBy([...transactions, ...parsedList], 'Hash');
                    }

                    this.setState({ transactions: parsedList, lastMarker: marker, canLoadMore }, () => {
                        resolve(parsedList);
                    });
                })
                .catch(() => {
                    Toast(Localize.t('events.canNotFetchTransactions'));
                    resolve([]);
                });
        });
    };

    loadMore = async () => {
        const { canLoadMore, filters, searchText, isLoadingMore, isLoading, sectionIndex } = this.state;

        if (isLoading || isLoadingMore || !canLoadMore || sectionIndex !== 0) return;

        this.setState({ isLoadingMore: true });

        await this.loadTransactions(true);

        this.setState({ isLoadingMore: false });

        // apply any new search ad filter to the new sources
        if (searchText) {
            this.applySearch(searchText);
        } else {
            this.applyFilters(filters);
        }
    };

    buildDataSource = (transactions: any, pendingRequests: any, plannedTransactions?: any): Array<DataSourceItem> => {
        const { sectionIndex } = this.state;

        if (isEmpty(pendingRequests) && isEmpty(transactions) && isEmpty(plannedTransactions)) {
            return [];
        }

        let items = [] as any;

        if (sectionIndex === 1) {
            const openItems = orderBy(
                filter(plannedTransactions, (p) =>
                    [
                        LedgerObjectTypes.Offer,
                        LedgerObjectTypes.NFTokenOffer,
                        LedgerObjectTypes.Check,
                        LedgerObjectTypes.Ticket,
                        LedgerObjectTypes.PayChannel,
                    ].includes(p.Type),
                ),
                ['Date'],
            );

            const plannedItems = orderBy(filter(plannedTransactions, { Type: LedgerObjectTypes.Escrow }), ['Date']);
            const dataSource = [];

            if (!isEmpty(openItems)) {
                dataSource.push({ data: Localize.t('events.eventTypeOpen'), type: DataSourceItemType.SectionHeader });
                map(openItems, (item) => dataSource.push({ data: item, type: DataSourceItemType.RowItem }));
            }

            if (!isEmpty(plannedItems)) {
                dataSource.push({ data: Localize.t('events.plannedOn'), type: DataSourceItemType.SectionHeader });
                const grouped = groupBy(plannedItems, (item) => {
                    return moment(item.Date).format('YYYY-MM-DD');
                });

                map(grouped, (v, k) => {
                    dataSource.push({ data: this.formatDate(k), type: DataSourceItemType.SectionHeader });
                    map(v, (item) => {
                        dataSource.push({ data: item, type: DataSourceItemType.RowItem });
                    });
                });
            }

            return dataSource;
        }
        if (sectionIndex === 2) {
            items = [...pendingRequests];
        } else {
            items = [...pendingRequests, ...transactions];
        }

        // group items by month name and then get the name for each month
        const grouped = groupBy(items, (item) => moment(item.Date).format('YYYY-MM-DD'));

        const dataSource: DataSourceItem[] = [];

        map(grouped, (v, k) => {
            dataSource.push({ data: this.formatDate(k), type: DataSourceItemType.SectionHeader });
            map(v, (item) => {
                dataSource.push({ data: item, type: DataSourceItemType.RowItem });
            });
        });

        return dataSource;
        // sort by date
        // const sorted = orderBy(dataSource, ['title'], ['desc']);
    };

    updateDataSource = async (include?: DataSourceType[]) => {
        const { filters, searchText, sectionIndex } = this.state;

        this.setState({ isLoading: true });

        let sourceTypes = [] as DataSourceType[];

        switch (sectionIndex) {
            case 0:
                sourceTypes = [DataSourceType.TRANSACTIONS, DataSourceType.PENDING_REQUESTS];
                break;

            case 1:
                sourceTypes = [DataSourceType.PLANNED_TRANSACTIONS];
                break;
            case 2:
                sourceTypes = [DataSourceType.PENDING_REQUESTS];
                break;
            default:
                break;
        }

        // only update the included source if it can be updated
        if (include) {
            sourceTypes = sourceTypes.filter((source) => include.includes(source));
        }

        // update data sources
        for (const source of sourceTypes) {
            if (source === DataSourceType.PENDING_REQUESTS) {
                await this.loadPendingRequests();
            } else if (source === DataSourceType.TRANSACTIONS) {
                await this.loadTransactions();
            } else if (source === DataSourceType.PLANNED_TRANSACTIONS) {
                await this.loadPlannedTransactions();
            }
        }

        this.setState({ isLoading: false });

        // apply any new search ad filter to the new sources
        if (searchText) {
            this.applySearch(searchText);
        } else {
            this.applyFilters(filters);
        }
    };

    applyFilters = (filters: FilterProps) => {
        const { sectionIndex, account, transactions, pendingRequests, plannedTransactions, canLoadMore } = this.state;

        if (sectionIndex === 2) {
            this.setState({
                dataSource: this.buildDataSource(transactions, pendingRequests, plannedTransactions),
            });
            return;
        }

        // check if filters are empty
        let isEmptyFilters = true;

        if (filters && typeof filters === 'object') {
            Object.keys(filters).map((k) => {
                if (!isUndefined(filters[k])) {
                    isEmptyFilters = false;
                    return false;
                }
                return true;
            });
        }

        if (isEmptyFilters) {
            this.setState({
                dataSource: this.buildDataSource(transactions, pendingRequests, plannedTransactions),
                filters: undefined,
            });
            return;
        }

        let newTransactions;

        if (sectionIndex === 0) {
            newTransactions = transactions;
        } else {
            newTransactions = plannedTransactions;
        }

        if (filters.TransactionType) {
            let includeTypes = [] as string[];
            switch (filters.TransactionType) {
                case 'Payment':
                    includeTypes = [TransactionTypes.Payment];
                    break;
                case 'TrustSet':
                    includeTypes = [TransactionTypes.TrustSet];
                    break;
                case 'Escrow':
                    includeTypes = [
                        TransactionTypes.EscrowCancel,
                        TransactionTypes.EscrowCreate,
                        TransactionTypes.EscrowFinish,
                        LedgerObjectTypes.Escrow,
                    ];
                    break;
                case 'Offer':
                    includeTypes = [
                        TransactionTypes.OfferCancel,
                        TransactionTypes.OfferCreate,
                        LedgerObjectTypes.Offer,
                        LedgerObjectTypes.NFTokenOffer,
                    ];
                    break;
                case 'Check':
                    includeTypes = [
                        TransactionTypes.CheckCancel,
                        TransactionTypes.CheckCreate,
                        TransactionTypes.CheckCash,
                        LedgerObjectTypes.Check,
                    ];
                    break;
                case 'NFT':
                    includeTypes = [
                        TransactionTypes.NFTokenMint,
                        TransactionTypes.NFTokenBurn,
                        TransactionTypes.NFTokenCreateOffer,
                        TransactionTypes.NFTokenAcceptOffer,
                        TransactionTypes.NFTokenCancelOffer,
                        LedgerObjectTypes.NFTokenOffer,
                    ];
                    break;
                case 'Other':
                    includeTypes = [
                        TransactionTypes.AccountSet,
                        TransactionTypes.PaymentChannelClaim,
                        TransactionTypes.PaymentChannelCreate,
                        TransactionTypes.PaymentChannelFund,
                        TransactionTypes.SetRegularKey,
                        TransactionTypes.SignerListSet,
                        TransactionTypes.TicketCreate,
                        TransactionTypes.DepositPreauth,
                        TransactionTypes.AccountDelete,
                        TransactionTypes.NFTokenAcceptOffer,
                        TransactionTypes.NFTokenBurn,
                        TransactionTypes.NFTokenCancelOffer,
                        TransactionTypes.NFTokenCreateOffer,
                        TransactionTypes.NFTokenMint,
                        LedgerObjectTypes.Ticket,
                    ];
                    break;
                default:
                    break;
            }

            newTransactions = filter(newTransactions, (t) => {
                return includeTypes.includes(get(t, 'Type'));
            });
        }

        if (filters.Amount && filters.AmountIndicator) {
            newTransactions = filter(newTransactions, (t) => {
                if (filters.AmountIndicator === 'Bigger') {
                    return (
                        parseFloat(get(t, 'Amount.value')) >= parseFloat(filters.Amount) ||
                        parseFloat(get(t, 'DeliverMin.value')) >= parseFloat(filters.Amount) ||
                        parseFloat(get(t, 'SendMax.value')) >= parseFloat(filters.Amount) ||
                        parseFloat(get(t, 'TakerGets.value')) >= parseFloat(filters.Amount) ||
                        parseFloat(get(t, 'TakerPays.value')) >= parseFloat(filters.Amount)
                    );
                }
                return (
                    parseFloat(get(t, 'Amount.value')) <= parseFloat(filters.Amount) ||
                    parseFloat(get(t, 'DeliverMin.value')) <= parseFloat(filters.Amount) ||
                    parseFloat(get(t, 'SendMax.value')) <= parseFloat(filters.Amount) ||
                    parseFloat(get(t, 'TakerGets.value')) <= parseFloat(filters.Amount) ||
                    parseFloat(get(t, 'TakerPays.value')) <= parseFloat(filters.Amount)
                );
            });
        }

        if (filters.Currency) {
            newTransactions = filter(newTransactions, (t) => {
                return (
                    get(t, 'Amount.currency') === filters.Currency ||
                    get(t, 'DeliverMin.currency') === filters.Currency ||
                    get(t, 'SendMax.currency') === filters.Currency ||
                    get(t, 'TakerGets.currency') === filters.Currency ||
                    get(t, 'TakerPays.currency') === filters.Currency
                );
            });
        }

        if (filters.ExpenseType) {
            newTransactions = filter(newTransactions, (t) => {
                if (filters.ExpenseType === 'Income') {
                    return get(t, 'Destination.address') === account.address;
                }
                return get(t, 'Destination.address') !== account.address;
            });
        }

        if (sectionIndex === 0) {
            if (isEmpty(newTransactions) && canLoadMore) {
                this.setState(
                    {
                        filters,
                    },
                    this.loadMore,
                );
            } else {
                this.setState({
                    dataSource: this.buildDataSource(newTransactions, [], plannedTransactions),
                    filters,
                });
            }
        } else {
            this.setState({
                dataSource: this.buildDataSource(transactions, [], newTransactions),
                filters,
            });
        }
    };

    applySearch = (text: string) => {
        const { plannedTransactions, pendingRequests, transactions, sectionIndex, canLoadMore } = this.state;

        if (isEmpty(text)) {
            this.setState({
                searchText: '',
                dataSource: this.buildDataSource(transactions, pendingRequests, plannedTransactions),
            });
            return;
        }

        let newTransactions = transactions;
        let newPendingRequests = pendingRequests;
        let newPlannedTransactions = plannedTransactions;

        const payloadFilter = new Fuse(pendingRequests, {
            keys: ['application.name'],
            shouldSort: false,
            includeScore: false,
        });

        const transactionFilter = new Fuse(transactions, {
            keys: [
                'Account.address',
                'Account.tag',
                'Account.name',
                'Destination.address',
                'Destination.name',
                'Destination.tag',
                'Amount.value',
                'Amount.currency',
                'Hash',
            ],
            shouldSort: false,
            includeScore: false,
            threshold: 0.1,
            minMatchCharLength: 2,
        });

        const plannedTransactionFilter = new Fuse(plannedTransactions, {
            keys: [
                'Account.address',
                'Account.tag',
                'Account.name',
                'Destination.address',
                'Destination.name',
                'Destination.tag',
                'Amount.value',
                'Amount.currency',
                'Owner',
                'NFTokenID',
                'Hash',
            ],
            shouldSort: false,
            includeScore: false,
            threshold: 0.1,
            minMatchCharLength: 2,
        });

        if (sectionIndex === 0) {
            newPendingRequests = flatMap(payloadFilter.search(text), 'item');
            newTransactions = flatMap(transactionFilter.search(text), 'item');
        } else if (sectionIndex === 1) {
            newPlannedTransactions = flatMap(plannedTransactionFilter.search(text), 'item');
        } else if (sectionIndex === 2) {
            newPendingRequests = flatMap(payloadFilter.search(text), 'item');
        }

        if (sectionIndex === 0 && isEmpty(newTransactions) && canLoadMore) {
            this.setState(
                {
                    searchText: text,
                    filters: undefined,
                },
                this.loadMore,
            );
        } else {
            this.setState({
                searchText: text,
                dataSource: this.buildDataSource(newTransactions, newPendingRequests, newPlannedTransactions),
                filters: undefined,
            });
        }
    };

    onFilterRemove = (keys: Array<string>) => {
        const { filters } = this.state;

        const newFilters = { ...filters };

        keys.forEach((k) => {
            newFilters[k] = undefined;
        });
        this.applyFilters(newFilters);
    };

    onSectionChange = (index: number) => {
        const { sectionIndex } = this.state;

        if (index === sectionIndex) {
            return;
        }

        this.setState(
            {
                sectionIndex: index,
                dataSource: [],
            },
            this.updateDataSource,
        );
    };

    renderEmptyAccount = () => {
        return (
            <View testID="events-tab-empty-view" style={AppStyles.tabContainer}>
                {/* Header */}
                <Header
                    placement="left"
                    containerStyle={AppStyles.headerContainer}
                    leftComponent={{
                        text: Localize.t('global.events'),
                        textStyle: AppStyles.h3,
                    }}
                />
                <ImageBackground
                    source={StyleService.getImage('BackgroundShapes')}
                    imageStyle={AppStyles.BackgroundShapes}
                    style={[AppStyles.contentContainer, AppStyles.padding]}
                >
                    <Image style={AppStyles.emptyIcon} source={StyleService.getImage('ImageNoEvents')} />
                    <Text style={AppStyles.emptyText}>{Localize.t('events.emptyEventsNoAccount')}</Text>
                    <Button
                        testID="add-account-button"
                        label={Localize.t('home.addAccount')}
                        icon="IconPlus"
                        iconStyle={AppStyles.imgColorWhite}
                        rounded
                        onPress={() => {
                            Navigator.push(AppScreens.Account.Add);
                        }}
                    />
                </ImageBackground>
            </View>
        );
    };

    renderListHeader = () => {
        const { filters, sectionIndex } = this.state;

        // ignore to show the header for request tab
        if (sectionIndex === 2) {
            return null;
        }

        return <EventsFilterChip filters={filters} onRemovePress={this.onFilterRemove} />;
    };

    render() {
        const { dataSource, isLoading, isLoadingMore, filters, account, sectionIndex } = this.state;
        const { timestamp } = this.props;

        if (!account) {
            return this.renderEmptyAccount();
        }

        return (
            <View testID="events-tab-view" style={AppStyles.tabContainer}>
                <Header
                    containerStyle={AppStyles.headerContainer}
                    leftComponent={{
                        text: Localize.t('global.events'),
                        textStyle: AppStyles.h3,
                    }}
                    rightComponent={{
                        icon: 'IconFilter',
                        iconSize: 25,
                        iconStyle: styles.filterIcon,
                        onPress: () => {
                            Navigator.showModal(AppScreens.Modal.FilterEvents, {
                                currentFilters: filters,
                                onApply: this.applyFilters,
                            });
                        },
                    }}
                    centerComponent={{
                        render: (): any => null,
                    }}
                />
                <SearchBar
                    containerStyle={AppStyles.marginHorizontalSml}
                    onChangeText={this.applySearch}
                    placeholder={Localize.t('global.search')}
                />
                <SegmentButton
                    selectedIndex={sectionIndex}
                    containerStyle={[AppStyles.paddingHorizontalSml, AppStyles.leftSelf]}
                    buttons={[
                        Localize.t('events.eventTypeAll'),
                        Localize.t('events.eventTypePlanned'),
                        Localize.t('events.eventTypeRequests'),
                    ]}
                    onPress={this.onSectionChange}
                />
                <EventsList
                    account={account}
                    headerComponent={this.renderListHeader}
                    dataSource={dataSource}
                    isLoading={isLoading}
                    isLoadingMore={isLoadingMore}
                    onEndReached={this.loadMore}
                    onRefresh={this.updateDataSource}
                    timestamp={timestamp}
                />
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default EventsView;
