/**
 * Events Screen
 */
import Fuse from 'fuse.js';
import moment from 'moment-timezone';
import { has, filter, flatMap, groupBy, isEmpty, isEqual, map, orderBy, uniqBy } from 'lodash';
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
import { TransactionTypes, LedgerEntryTypes } from '@common/libs/ledger/types/enums';
import { NFTokenOffer } from '@common/libs/ledger/objects';
import { Payload } from '@common/libs/payload';

import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { LedgerMarker } from '@common/libs/ledger/types/common';
import { Transactions } from '@common/libs/ledger/transactions/types';
import { LedgerEntry } from '@common/libs/ledger/types/ledger';

import { MixingTypes } from '@common/libs/ledger/mixin/types';
import { FilterProps } from '@screens/Modal/FilterEvents/EventsFilterModal';

import {
    AccountService,
    AppService,
    BackendService,
    LedgerService,
    PushNotificationsService,
    StyleService,
} from '@services';
import { AppStateStatus } from '@services/AppService';

import { Button, Header, SearchBar, SegmentButtons } from '@components/General';
import { EventsFilterChip, EventsList } from '@components/Modules';

import Localize from '@locale';

import { AccountAddViewProps } from '@screens/Account/Add';
import { EventsFilterModalProps } from '@screens/Modal/FilterEvents';

import { DataSourceItem, RowItemType } from '@components/Modules/EventsList/EventsList';

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
    searchText?: string;
    filters?: FilterProps;
    activeSection: EventSections;
    lastMarker?: LedgerMarker;
    account: AccountModel;
    transactions: Array<Transactions>;
    plannedTransactions: Array<LedgerObjects>;
    pendingRequests: Array<Payload | NFTokenOffer>;
    dataSource: Array<DataSourceItem>;
}

enum EventSections {
    ALL = 'ALL',
    PLANNED = 'PLANNED',
    REQUESTS = 'REQUESTS',
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
    private navigationListener: EventSubscription | undefined;

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
            activeSection: EventSections.ALL,
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
        const { account, activeSection } = this.state;

        if (account?.isValid() && (activeSection === EventSections.ALL || activeSection === EventSections.REQUESTS)) {
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

        if (momentDate.isValid()) {
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
        }

        return 'N/A';
    };

    fetchPlannedObjects = async (
        account: string,
        type: string,
        marker?: string,
        combined = [] as LedgerEntry[],
    ): Promise<LedgerEntry[]> => {
        return LedgerService.getAccountObjects(account, { type, marker }).then((resp) => {
            // account is not found
            if ('error' in resp) {
                return [];
            }

            const { account_objects, marker: _marker } = resp;

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
            let objects = [] as LedgerEntry[];

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
                    const parsedList = objects
                        .map(LedgerObjectFactory.fromLedger)
                        .flat()
                        .filter((item): item is LedgerObjects => item !== undefined);

                    this.setState({ plannedTransactions: parsedList }, () => {
                        resolve(parsedList);
                    });
                })
                .catch(() => {
                    Toast(Localize.t('events.canNotFetchTransactions'));
                    resolve([]);
                });
        });
    };

    loadPendingRequests = () => {
        const { account, activeSection } = this.state;

        return new Promise((resolve) => {
            const promises = [BackendService.getPendingPayloads()] as any;

            // only load XLS20 offers on requests section
            if (activeSection === EventSections.REQUESTS) {
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
                    if ('error' in resp) {
                        resolve([]);
                        return;
                    }

                    const { transactions: txResp, marker } = resp;
                    let canLoadMore = true;

                    // if we got less than 50 transaction, means there is no transaction
                    // also only handle recent 1000 transactions
                    if (txResp.length < 50 || transactions.length >= 1000) {
                        canLoadMore = false;
                    }

                    // only success transactions
                    const tesSuccessTransactions = filter(txResp, (transaction) => {
                        return (
                            typeof transaction.meta === 'object' && transaction?.meta.TransactionResult === 'tesSUCCESS'
                        );
                    });

                    let parsedList = flatMap(tesSuccessTransactions, (item) =>
                        TransactionFactory.fromLedger(item, [MixingTypes.Mutation]),
                    );

                    if (loadMore) {
                        parsedList = uniqBy([...transactions, ...parsedList], 'hash');
                    }

                    this.setState({ transactions: parsedList, lastMarker: marker, canLoadMore }, () => {
                        resolve(parsedList);
                    });
                })
                .catch(() => {
                    // TODO: BETTER ERROR HANDLING AND ONLY SHOW WHEN SCREEN IS VISIBLE
                    Toast(Localize.t('events.canNotFetchTransactions'));
                    resolve([]);
                });
        });
    };

    loadMore = async () => {
        const { canLoadMore, filters, searchText, isLoadingMore, isLoading, activeSection } = this.state;

        if (isLoading || isLoadingMore || !canLoadMore || activeSection !== EventSections.ALL) return;

        this.setState({ isLoadingMore: true });

        await this.loadTransactions(true);

        this.setState({ isLoadingMore: false });

        // apply any new search ad filter to the new sources
        if (searchText) {
            this.applySearch(searchText);
        } else if (filters) {
            this.applyFilters(filters);
        } else {
            this.applyDefaults();
        }
    };

    buildDataSource = (transactions: any, pendingRequests: any, plannedTransactions?: any): Array<DataSourceItem> => {
        const { activeSection } = this.state;

        if (isEmpty(pendingRequests) && isEmpty(transactions) && isEmpty(plannedTransactions)) {
            return [];
        }

        let items: RowItemType[] = [];

        if (activeSection === EventSections.PLANNED) {
            const openItems = orderBy(
                filter(plannedTransactions, (p) =>
                    [
                        LedgerEntryTypes.Offer,
                        LedgerEntryTypes.NFTokenOffer,
                        LedgerEntryTypes.Check,
                        LedgerEntryTypes.Ticket,
                        LedgerEntryTypes.PayChannel,
                    ].includes(p.Type),
                ),
                ['Date'],
            );

            const plannedItems = orderBy(filter(plannedTransactions, { Type: LedgerEntryTypes.Escrow }), ['Date']);
            const dataSource: DataSourceItem[] = [];

            if (!isEmpty(openItems)) {
                dataSource.push({
                    header: Localize.t('events.eventTypeOpen'),
                    data: openItems,
                });
            }

            if (!isEmpty(plannedItems)) {
                dataSource.push({
                    header: Localize.t('events.plannedOn'),
                    data: [],
                });

                const grouped = groupBy(plannedItems, (item) => {
                    return item.Date ? moment(item.Date).format('YYYY-MM-DD') : '';
                });

                map(grouped, (v, k) => {
                    dataSource.push({
                        header: this.formatDate(k),
                        data: v,
                    });
                });
            }

            return dataSource;
        }
        if (activeSection === EventSections.REQUESTS) {
            items = [...pendingRequests];
        } else {
            items = [...pendingRequests, ...transactions];
        }

        // group items by month name and then get the name for each month
        const grouped = groupBy(items, (item) => (item.Date ? moment(item.Date).format('YYYY-MM-DD') : ''));

        const dataSource: DataSourceItem[] = [];

        map(grouped, (v, k) => {
            dataSource.push({
                header: this.formatDate(k),
                data: v,
            });
        });

        return dataSource;
    };

    updateDataSource = async (include?: DataSourceType[]) => {
        const { filters, searchText, activeSection } = this.state;

        this.setState({ isLoading: true });

        let sourceTypes = [] as DataSourceType[];

        switch (activeSection) {
            case EventSections.ALL:
                sourceTypes = [DataSourceType.TRANSACTIONS, DataSourceType.PENDING_REQUESTS];
                break;
            case EventSections.PLANNED:
                sourceTypes = [DataSourceType.PLANNED_TRANSACTIONS];
                break;
            case EventSections.REQUESTS:
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

        // apply any new search and filter to the new sources
        if (searchText) {
            this.applySearch(searchText);
        } else if (filters) {
            this.applyFilters(filters);
        } else {
            this.applyDefaults();
        }
    };

    applyDefaults = () => {
        const { transactions, pendingRequests, plannedTransactions } = this.state;

        this.setState({
            dataSource: this.buildDataSource(transactions, pendingRequests, plannedTransactions),
        });
    };

    applyFilters = (filters: FilterProps) => {
        const { activeSection, account, transactions, pendingRequests, plannedTransactions, canLoadMore } = this.state;

        if (activeSection === EventSections.REQUESTS) {
            this.setState({
                dataSource: this.buildDataSource(transactions, pendingRequests, plannedTransactions),
            });
            return;
        }

        // check if filters are empty
        let isEmptyFilters = true;

        if (filters && typeof filters === 'object') {
            Object.keys(filters).map((k) => {
                if (typeof filters[k] !== 'undefined') {
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

        if (activeSection === EventSections.ALL) {
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
                        LedgerEntryTypes.Escrow,
                    ];
                    break;
                case 'Offer':
                    includeTypes = [
                        TransactionTypes.OfferCancel,
                        TransactionTypes.OfferCreate,
                        LedgerEntryTypes.Offer,
                        LedgerEntryTypes.NFTokenOffer,
                    ];
                    break;
                case 'Check':
                    includeTypes = [
                        TransactionTypes.CheckCancel,
                        TransactionTypes.CheckCreate,
                        TransactionTypes.CheckCash,
                        LedgerEntryTypes.Check,
                    ];
                    break;
                case 'NFT':
                    includeTypes = [
                        TransactionTypes.NFTokenMint,
                        TransactionTypes.NFTokenBurn,
                        TransactionTypes.NFTokenCreateOffer,
                        TransactionTypes.NFTokenAcceptOffer,
                        TransactionTypes.NFTokenCancelOffer,
                        LedgerEntryTypes.NFTokenOffer,
                    ];
                    break;
                case 'AMM':
                    includeTypes = [
                        TransactionTypes.AMMCreate,
                        TransactionTypes.AMMDelete,
                        TransactionTypes.AMMDeposit,
                        TransactionTypes.AMMWithdraw,
                        TransactionTypes.AMMBid,
                        TransactionTypes.AMMVote,
                    ];
                    break;
                case 'URIToken':
                    includeTypes = [
                        TransactionTypes.URITokenMint,
                        TransactionTypes.URITokenBuy,
                        TransactionTypes.URITokenBurn,
                        TransactionTypes.URITokenCreateSellOffer,
                        TransactionTypes.URITokenCancelSellOffer,
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
                        LedgerEntryTypes.Ticket,
                    ];
                    break;
                default:
                    break;
            }

            newTransactions = newTransactions.filter((element) => includeTypes.includes(element?.Type));
        }

        if (filters.Amount && filters.AmountIndicator) {
            newTransactions = filter(newTransactions, (element) => {
                if (filters.AmountIndicator === 'Bigger') {
                    return (
                        ('Amount' in element && parseFloat(element?.Amount!.value) >= parseFloat(filters.Amount!)) ||
                        ('DeliverMin' in element &&
                            parseFloat(element?.DeliverMin!.value) >= parseFloat(filters.Amount!)) ||
                        ('SendMax' in element && parseFloat(element?.SendMax!.value) >= parseFloat(filters.Amount!)) ||
                        ('TakerGets' in element &&
                            parseFloat(element?.TakerGets!.value) >= parseFloat(filters.Amount!)) ||
                        ('TakerPays' in element && parseFloat(element?.TakerPays!.value) >= parseFloat(filters.Amount!))
                    );
                }
                return (
                    ('Amount' in element && parseFloat(element.Amount!.value) <= parseFloat(filters.Amount!)) ||
                    ('DeliverMin' in element && parseFloat(element.DeliverMin!.value) <= parseFloat(filters.Amount!)) ||
                    ('SendMax' in element && parseFloat(element.SendMax!.value) <= parseFloat(filters.Amount!)) ||
                    ('TakerGets' in element && parseFloat(element.TakerGets!.value) <= parseFloat(filters.Amount!)) ||
                    ('TakerPays' in element && parseFloat(element.TakerPays!.value) <= parseFloat(filters.Amount!))
                );
            });
        }

        if (filters.Currency) {
            newTransactions = newTransactions.filter(
                (element) =>
                    ('Amount' in element && element.Amount!.currency === filters.Currency) ||
                    ('DeliverMin' in element && element.DeliverMin!.currency === filters.Currency) ||
                    ('SendMax' in element && element.SendMax!.currency === filters.Currency) ||
                    ('TakerGets' in element && element.TakerGets!.currency === filters.Currency) ||
                    ('TakerPays' in element && element.TakerPays!.currency === filters.Currency),
            );
        }

        if (filters.ExpenseType) {
            newTransactions = newTransactions.filter((element) => {
                if ('Destination' in element) {
                    if (filters.ExpenseType === 'Income') {
                        return element?.Destination === account.address;
                    }
                    return element?.Destination !== account.address;
                }
                return false;
            });
        }

        if (activeSection === EventSections.ALL) {
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
        const { plannedTransactions, pendingRequests, transactions, activeSection, canLoadMore } = this.state;

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
                'Destination.address',
                'Destination.tag',
                'Amount.value',
                'Amount.currency',
                'Currency', // TrustSet currency
                'Issuer', // TrustSet issuer
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
                'Destination.address',
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

        if (activeSection === EventSections.ALL) {
            newPendingRequests = flatMap(payloadFilter.search(text), 'item');
            newTransactions = flatMap(transactionFilter.search(text), 'item');
        } else if (activeSection === EventSections.PLANNED) {
            newPlannedTransactions = flatMap(plannedTransactionFilter.search(text), 'item');
        } else if (activeSection === EventSections.REQUESTS) {
            newPendingRequests = flatMap(payloadFilter.search(text), 'item');
        }

        if (activeSection === EventSections.ALL && isEmpty(newTransactions) && canLoadMore) {
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

    onSectionChange = ({ value }: { value: EventSections }) => {
        const { activeSection } = this.state;

        if (value === activeSection) {
            return;
        }

        this.setState(
            {
                activeSection: value,
                dataSource: [],
            },
            this.updateDataSource,
        );
    };

    onAddAccountPress = () => {
        Navigator.push<AccountAddViewProps>(AppScreens.Account.Add, {});
    };

    onFilterEventsPress = () => {
        const { filters } = this.state;

        Navigator.showModal<EventsFilterModalProps>(AppScreens.Modal.FilterEvents, {
            currentFilters: filters ?? {},
            onApply: this.applyFilters,
        });
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
                        onPress={this.onAddAccountPress}
                    />
                </ImageBackground>
            </View>
        );
    };

    renderListHeader = () => {
        const { filters, activeSection } = this.state;

        // ignore to show the header for request tab
        if (activeSection === EventSections.REQUESTS) {
            return null;
        }

        return <EventsFilterChip filters={filters} onRemovePress={this.onFilterRemove} />;
    };

    render() {
        const { dataSource, isLoading, isLoadingMore, account, activeSection } = this.state;
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
                        onPress: this.onFilterEventsPress,
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
                <SegmentButtons
                    activeButton={activeSection}
                    containerStyle={[AppStyles.paddingHorizontalSml, AppStyles.leftSelf]}
                    buttons={[
                        {
                            label: Localize.t('events.eventTypeAll'),
                            value: EventSections.ALL,
                        },
                        {
                            label: Localize.t('events.eventTypePlanned'),
                            value: EventSections.PLANNED,
                        },
                        {
                            label: Localize.t('events.eventTypeRequests'),
                            value: EventSections.REQUESTS,
                        },
                    ]}
                    onItemPress={this.onSectionChange}
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
