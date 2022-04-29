/**
 * Events Screen
 */
import Fuse from 'fuse.js';
import moment from 'moment-timezone';
import { filter, flatMap, get, groupBy, isEmpty, isEqual, isUndefined, map, orderBy, uniqBy, without } from 'lodash';
import React, { Component } from 'react';
import { Image, ImageBackground, InteractionManager, SafeAreaView, Text } from 'react-native';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// Constants/Helpers
import { AppScreens } from '@common/constants';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

// Parses
import { LedgerObjectFactory, TransactionFactory } from '@common/libs/ledger/factory';
import { LedgerEntriesTypes, LedgerMarker, LedgerObjectTypes, TransactionTypes } from '@common/libs/ledger/types';
import { Transactions } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { Payload } from '@common/libs/payload';

// types
import { FilterProps } from '@screens/Modal/FilterEvents/EventsFilterView';

// Services
import { AccountService, BackendService, LedgerService, PushNotificationsService, StyleService } from '@services';

// Components
import { Button, Header, SearchBar, SegmentButton } from '@components/General';
import { EventsFilterChip, EventsList } from '@components/Modules';

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
    account: AccountSchema;
    transactions: Array<Transactions>;
    plannedTransactions: Array<LedgerObjects>;
    pendingRequests: Array<Payload>;
    dataSource: Array<Transactions | LedgerObjects | Payload>;
}

/* Component ==================================================================== */
class EventsView extends Component<Props, State> {
    static screenName = AppScreens.TabBar.Events;
    static whyDidYouRender = true;

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
            account: AccountRepository.getDefaultAccount(),
            transactions: [],
            pendingRequests: [],
            plannedTransactions: [],
            dataSource: [],
        };
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

    componentDidMount() {
        const { account } = this.state;

        // add listener for default account change
        AccountRepository.on('changeDefaultAccount', this.onDefaultAccountChange);

        // update list on transaction received
        AccountService.on('transaction', this.onTransactionReceived);

        // update list on sign request received
        PushNotificationsService.on('signRequestUpdate', this.updateDataSource);

        // update data source after component mount
        InteractionManager.runAfterInteractions(() => {
            if (account?.isValid()) {
                this.updateDataSource(true);
            }
        });
    }

    componentWillUnmount() {
        // remove listeners
        AccountRepository.off('changeDefaultAccount', this.onDefaultAccountChange);
        AccountService.off('transaction', this.onTransactionReceived);
        PushNotificationsService.off('signRequestUpdate', this.updateDataSource);
    }

    onDefaultAccountChange = (account: AccountSchema) => {
        this.setState(
            {
                account,
                dataSource: [],
                transactions: [],
                plannedTransactions: [],
                lastMarker: undefined,
            },
            () => {
                this.updateDataSource(true);
            },
        );
    };

    onTransactionReceived = (transaction: any, effectedAccounts: Array<string>) => {
        const { account } = this.state;

        if (account.isValid()) {
            if (effectedAccounts.indexOf(account.address) !== -1) {
                this.updateDataSource();
            }
        }
    };

    fetchPlannedObjects = (
        account: string,
        type: string,
        marker?: string,
        combined = [] as LedgerEntriesTypes[],
    ): Promise<LedgerEntriesTypes[]> => {
        return LedgerService.getAccountObjects(account, { type, marker }).then((resp) => {
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
            const objectTypes = ['check', 'escrow', 'offer', 'ticket'];
            let objects = [] as LedgerEntriesTypes[];

            objectTypes
                .reduce((accumulator, type) => {
                    return accumulator.then(() => {
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
        return new Promise((resolve) => {
            BackendService.getPendingPayloads()
                .then((payloads) => {
                    this.setState({ pendingRequests: payloads }, () => {
                        resolve(payloads);
                    });
                })
                .catch(() => {
                    Toast(Localize.t('events.canNotFetchSignRequests'));
                    resolve([]);
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
                        return t.TransactionResult.success;
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

    buildDataSource = (transactions: any, pendingRequests: any, plannedTransactions?: any) => {
        const { sectionIndex } = this.state;

        if (isEmpty(pendingRequests) && isEmpty(transactions) && isEmpty(plannedTransactions)) {
            return [];
        }

        let items = [] as any;

        if (sectionIndex === 1) {
            const open = orderBy(
                filter(plannedTransactions, (p) =>
                    [LedgerObjectTypes.Offer, LedgerObjectTypes.Check, LedgerObjectTypes.Ticket].includes(p.Type),
                ),
                ['Date'],
            );

            const planned = orderBy(filter(plannedTransactions, { Type: LedgerObjectTypes.Escrow }), ['Date']);
            const dataSource = [];

            if (!isEmpty(open)) {
                dataSource.push({
                    title: 'Open',
                    type: 'string',
                    data: open,
                });
            }

            if (!isEmpty(planned)) {
                dataSource.push({ title: Localize.t('events.plannedOn'), type: 'string', data: [] });
                const grouped = groupBy(planned, (item) => {
                    return moment(item.Date).format('YYYY-MM-DD');
                });

                map(grouped, (v, k) => {
                    dataSource.push({ title: k, data: v, type: 'date' });
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

        const dataSource = [] as any;

        map(grouped, (v, k) => {
            dataSource.push({ title: k, data: v, type: 'date' });
        });

        // sort by date
        return orderBy(dataSource, ['title'], ['desc']);
    };

    updateDataSource = async (background = false) => {
        const { filters, searchText, sectionIndex } = this.state;

        if (!background) {
            this.setState({ isLoading: true });
        }

        if (sectionIndex === 1) {
            await this.loadPlannedTransactions();
        } else if (sectionIndex === 2) {
            await this.loadPendingRequests();
        } else {
            // update all sources
            await this.loadPendingRequests();
            await this.loadTransactions();
        }

        const { isLoading } = this.state;

        if (isLoading) {
            this.setState({ isLoading: false });
        }

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
            <SafeAreaView testID="events-tab-empty-view" style={[AppStyles.tabContainer]}>
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
                    <Image style={[AppStyles.emptyIcon]} source={StyleService.getImage('ImageNoEvents')} />
                    <Text style={[AppStyles.emptyText]}>{Localize.t('events.emptyEventsNoAccount')}</Text>
                    <Button
                        testID="add-account-button"
                        label={Localize.t('home.addAccount')}
                        icon="IconPlus"
                        iconStyle={[AppStyles.imgColorWhite]}
                        rounded
                        onPress={() => {
                            Navigator.push(AppScreens.Account.Add);
                        }}
                    />
                </ImageBackground>
            </SafeAreaView>
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
        const { dataSource, isLoading, isLoadingMore, filters, account } = this.state;
        const { timestamp } = this.props;

        if (!account) {
            return this.renderEmptyAccount();
        }

        return (
            <SafeAreaView testID="events-tab-view" style={[AppStyles.tabContainer, styles.container]}>
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
                    containerStyle={AppStyles.paddingHorizontalSml}
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
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default EventsView;
