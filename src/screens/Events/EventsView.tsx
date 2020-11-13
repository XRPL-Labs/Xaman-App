/**
 * Events Screen
 */
import Fuse from 'fuse.js';
import moment from 'moment-timezone';
import { isEmpty, flatMap, isUndefined, isEqual, filter, get, uniqBy, groupBy, map, without, sortBy } from 'lodash';
import React, { Component } from 'react';
import { SafeAreaView, View, Text, InteractionManager, ImageBackground, Image } from 'react-native';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// Constants/Helpers
import { AppScreens } from '@common/constants';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

// Parses
import transactionFactory from '@common/libs/ledger/parser/transaction';
import ledgerObjectFactory from '@common/libs/ledger/parser/object';

import { LedgerMarker } from '@common/libs/ledger/types';
import { TransactionsType } from '@common/libs/ledger/transactions/types';
import { Payload } from '@common/libs/payload';

// types
import { FilterProps } from '@screens/Modal/FilterEvents/EventsFilterView';

// Services
import { LedgerService, BackendService, PushNotificationsService } from '@services';

// Components
import { SearchBar, Button, SegmentButton, Header } from '@components/General';
import { EventsFilterChip, EventsList } from '@components/Modules';

// Locale
import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* Constants ==================================================================== */
const SECTIONS = ['All', 'Planned', 'Requests'];

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
    section: typeof SECTIONS[number];
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
            section: SECTIONS[0],
            lastMarker: undefined,
            account: AccountRepository.getDefaultAccount(),
            transactions: [],
            pendingRequests: [],
            plannedTransactions: [],
            dataSource: undefined,
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
            if (account.isValid()) {
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
            if (isEmpty(account)) {
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
            if (isEmpty(account)) {
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
        const { canLoadMore, filters, searchText, isLoadingMore, isLoading, section } = this.state;

        if (isLoading || isLoadingMore || !canLoadMore || ['Planned', 'Requests'].indexOf(section) > -1) return;

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
        const { section } = this.state;

        if (isEmpty(pendingRequests) && isEmpty(transactions) && isEmpty(plannedTransactions)) {
            return [];
        }

        let items = [] as any;

        if (section === 'Planned') {
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
                dataSource.push({ title: 'Planned on', type: 'string', data: [] });
                const grouped = groupBy(planned, (item) => {
                    return moment(item.Date, 'YYYY-MM-DD').format('YYYY-MM-DD');
                });

                map(grouped, (v, k) => {
                    dataSource.push({ title: k, data: v, type: 'date' });
                });
            }

            return dataSource;
        }
        if (section === 'Requests') {
            items = [...pendingRequests];
        } else {
            items = [...pendingRequests, ...transactions];
        }

        // group items by month name and then get the name for each month
        const grouped = groupBy(items, (item) => moment(item.Date, 'YYYY-MM-DD').format('YYYY-MM-DD'));

        const dateSource = [] as any;

        map(grouped, (v, k) => {
            dateSource.push({ title: k, data: v, type: 'date' });
        });

        return dateSource;
    };

    updateDataSource = async (background = false) => {
        const { filters, searchText, section } = this.state;

        if (!background) {
            this.setState({ isLoading: true });
        }

        if (section === 'Planned') {
            await this.loadPlannedTransactions();
        } else if (section === 'Requests') {
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
        const { section, account, transactions, pendingRequests, plannedTransactions, canLoadMore } = this.state;

        if (section === 'Requests') {
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

        if (section === 'All') {
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

        if (section === 'All') {
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
        const { plannedTransactions, pendingRequests, transactions, section, canLoadMore } = this.state;

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

        if (section === 'All') {
            newPendingRequests = flatMap(payloadFilter.search(text), 'item');
            newTransactions = flatMap(transactionFilter.search(text), 'item');
        } else if (section === 'Planned') {
            newPlannedTransactions = flatMap(plannedTransactionFilter.search(text), 'item');
        } else if (section === 'Requests') {
            newPendingRequests = flatMap(payloadFilter.search(text), 'item');
        }

        if (section === 'All' && isEmpty(newTransactions) && canLoadMore) {
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
                section: SECTIONS[index],
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

                <View style={[AppStyles.contentContainer, AppStyles.padding]}>
                    <ImageBackground
                        source={Images.BackgroundShapes}
                        imageStyle={AppStyles.BackgroundShapes}
                        style={[AppStyles.BackgroundShapesWH, AppStyles.centerContent]}
                    >
                        <Image style={[AppStyles.emptyIcon]} source={Images.ImageNoEvents} />
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
                </View>
            </SafeAreaView>
        );
    };

    renderListHeader = () => {
        const { filters, section } = this.state;

        if (section === 'Requests') {
            return null;
        }

        return <EventsFilterChip filters={filters} onRemovePress={this.onFilterRemove} />;
    };

    render() {
        const { dataSource, isLoading, isLoadingMore, filters, account } = this.state;

        if (isEmpty(account)) {
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
                    buttons={SECTIONS}
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
                />
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default EventsView;
