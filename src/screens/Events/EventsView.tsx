/**
 * Events Screen
 */
import Fuse from 'fuse.js';
import moment from 'moment-timezone';
import { isEmpty, flatMap, isUndefined, isEqual, filter, get, uniqBy, groupBy, map, without, sortBy } from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, Text, InteractionManager, ImageBackground, Image } from 'react-native';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// Constants/Helpers
import { AppScreens } from '@common/constants';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

// Parses
import transactionFactory from '@common/libs/ledger/parser/transaction';
import ledgerObjectFactory from '@common/libs/ledger/parser/object';

import { LedgerMarker } from '@common/libs/ledger/types';
import { TransactionsType } from '@common/libs/ledger/transactions/types';
import { Payload } from '@common/libs/payload';

// types
import { FilterProps } from '@screens/Modal/FilterEvents/EventsFilterView';

// Services
import { LedgerService, BackendService, PushNotificationsService, StyleService } from '@services';

// Components
import { SearchBar, Button, SegmentButton, Header } from '@components/General';
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
    transactions: Array<TransactionsType>;
    plannedTransactions: Array<any>;
    pendingRequests: Array<Payload>;
    dataSource: Array<any>;
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

    componentDidMount = () => {
        const { account } = this.state;

        // add listener for default account change
        AccountRepository.on('changeDefaultAccount', this.onDefaultAccountChange);

        // update list on transaction received
        LedgerService.on('transaction', this.updateDataSource);

        // update list on sign request received
        PushNotificationsService.on('signRequestUpdate', this.updateDataSource);

        // update data source after component mount
        InteractionManager.runAfterInteractions(() => {
            if (account?.isValid()) {
                this.updateDataSource(true);
            }
        });
    };

    componentWillUnmount = () => {
        // remove listeners
        AccountRepository.off('changeDefaultAccount', this.onDefaultAccountChange);
        LedgerService.off('transaction', this.updateDataSource);
        PushNotificationsService.off('signRequestUpdate', this.updateDataSource);
    };

    onDefaultAccountChange = (account: AccountSchema) => {
        this.setState(
            {
                account,
                dataSource: undefined,
                transactions: [],
                plannedTransactions: [],
                lastMarker: undefined,
            },
            () => {
                this.updateDataSource(true);
            },
        );
    };

    loadPlannedTransactions = () => {
        const { account } = this.state;

        return new Promise((resolve) => {
            // return if no account exist
            if (!account) {
                return resolve([]);
            }
            return LedgerService.getAccountObjects(account.address).then((res: any) => {
                const { account_objects } = res;
                const parsedList = flatMap(account_objects, ledgerObjectFactory);
                const filtered = without(parsedList, null);

                this.setState({ plannedTransactions: filtered }, () => {
                    return resolve(filtered);
                });
            });
        });
    };

    loadPendingRequests = () => {
        return new Promise((resolve) => {
            return BackendService.getPendingPayloads().then((payloads) => {
                this.setState({ pendingRequests: payloads }, () => {
                    return resolve(payloads);
                });
            });
        });
    };

    loadTransactions = (loadMore?: boolean): Promise<TransactionsType[]> => {
        const { transactions, account, lastMarker } = this.state;

        return new Promise((resolve) => {
            // return if no account exist
            if (!account) {
                return resolve([]);
            }

            return LedgerService.getTransactions(account.address, loadMore && lastMarker, 100)
                .then((resp) => {
                    const { transactions: txResp, marker } = resp;
                    let canLoadMore = true;

                    // if we got less than 100 transaction, means there is no transaction
                    // also only handle recent 1000 transactions
                    if (txResp.length < 100 || transactions.length >= 1000) {
                        canLoadMore = false;
                    }

                    let parsedList = filter(flatMap(txResp, transactionFactory), (t) => {
                        return t.TransactionResult.success;
                    });

                    if (loadMore) {
                        parsedList = uniqBy([...transactions, ...parsedList], 'Hash');
                    }

                    this.setState({ transactions: parsedList, lastMarker: marker, canLoadMore }, () => {
                        return resolve(parsedList);
                    });
                })
                .catch(() => {
                    Toast(Localize.t('events.canNotFetchTransactions'));
                    return resolve([]);
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
            const open = sortBy(
                filter(plannedTransactions, (p) => p.Type === 'Offer' || p.Type === 'Check'),
                ['Date'],
            );

            const planned = sortBy(filter(plannedTransactions, { Type: 'Escrow' }), ['Date']);
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

        const dateSource = [] as any;

        map(grouped, (v, k) => {
            dateSource.push({ title: k, data: v, type: 'date' });
        });

        return dateSource;
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

        let newTransactions = [];

        if (sectionIndex === 0) {
            newTransactions = transactions;
        } else {
            newTransactions = plannedTransactions;
        }

        if (filters.Amount && filters.AmountIndicator) {
            newTransactions = filter(newTransactions, (t) => {
                if (filters.AmountIndicator === 'Bigger') {
                    return (
                        parseFloat(get(t, 'Amount.value')) >= parseFloat(filters.Amount) ||
                        parseFloat(get(t, 'DeliverMin.value')) >= parseFloat(filters.Amount) ||
                        parseFloat(get(t, 'SendMax.value')) >= parseFloat(filters.Amount)
                    );
                }
                return (
                    parseFloat(get(t, 'Amount.value')) <= parseFloat(filters.Amount) ||
                    parseFloat(get(t, 'DeliverMin.value')) <= parseFloat(filters.Amount) ||
                    parseFloat(get(t, 'SendMax.value')) <= parseFloat(filters.Amount)
                );
            });
        }

        if (filters.Currency) {
            newTransactions = filter(newTransactions, (t) => {
                return (
                    get(t, 'Amount.currency') === filters.Currency ||
                    get(t, 'DeliverMin.currency') === filters.Currency ||
                    get(t, 'SendMax.currency') === filters.Currency
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

        if (filters.TransactionType) {
            const includeTypes = [] as string[];
            switch (filters.TransactionType) {
                case 'Payment':
                    includeTypes.push('Payment');
                    break;
                case 'TrustSet':
                    includeTypes.push('TrustSet');
                    break;
                case 'Escrow':
                    includeTypes.push(...['EscrowCancel', 'EscrowCreate', 'EscrowFinish', 'Escrow']);
                    break;
                case 'Offer':
                    includeTypes.push(...['OfferCancel', 'OfferCreate', 'Offer']);
                    break;
                case 'Check':
                    includeTypes.push(...['CheckCancel', 'CheckCreate', 'CheckCash', 'Check']);
                    break;
                case 'Other':
                    includeTypes.push(
                        ...[
                            'AccountSet',
                            'PaymentChannelClaim',
                            'PaymentChannelCreate',
                            'PaymentChannelFund',
                            'SetRegularKey',
                            'SignerListSet',
                        ],
                    );
                    break;
                default:
                    break;
            }

            newTransactions = filter(newTransactions, (t) => {
                return includeTypes.indexOf(get(t, 'Type')) !== -1;
            });
        }

        if (sectionIndex === 0) {
            if (isEmpty(newTransactions) && canLoadMore) {
                this.setState(
                    {
                        filters,
                    },
                    () => {
                        this.loadMore();
                    },
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
                () => {
                    this.loadMore();
                },
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
        this.setState(
            {
                sectionIndex: index,
            },
            () => {
                this.updateDataSource();
            },
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
                {/* Header */}
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
                            Navigator.showModal(
                                AppScreens.Modal.FilterEvents,
                                {},
                                {
                                    currentFilters: filters,
                                    onApply: this.applyFilters,
                                },
                            );
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
