/**
 * Events Screen
 */
import Fuse from 'fuse.js';
import moment from 'moment';
import { isEmpty, flatMap, isUndefined, isEqual, filter, get, uniqBy, groupBy, map } from 'lodash';
import React, { Component } from 'react';
import { Navigation } from 'react-native-navigation';
import {
    SafeAreaView,
    View,
    Text,
    TouchableOpacity,
    SectionList,
    ActivityIndicator,
    InteractionManager,
    ImageBackground,
    Image,
} from 'react-native';

import { AccountRepository } from '@store/repositories';
import { AccountSchema } from '@store/schemas/latest';

// Constants/Helpers
import { AppScreens } from '@common/constants';
import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';
import { NormalizeDate } from '@common/libs/utils';

// Parses
import parserFactory from '@common/libs/ledger/parser';
import { LedgerMarker } from '@common/libs/ledger/types';
import { TransactionsType } from '@common/libs/ledger/transactions/types';
import { Payload } from '@common/libs/payload';

// types
import { FilterProps } from '@screens/Modal/FilterEvents/EventsFilterView';

// Services
import { LedgerService, BackendService, PushNotificationsService } from '@services';

// Components
import { SearchBar, Button, Icon } from '@components/General';

// Locale
import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

// Templates
import * as Templates from './Templates';

/* types ==================================================================== */
export interface Props {}

export interface State {
    isLoading: boolean;
    isLoadingMore: boolean;
    shouldLoadMore: boolean;
    filters: FilterProps;
    searchText: string;
    lastMarker: LedgerMarker;
    account: AccountSchema;
    transactions: Array<TransactionsType>;
    pendingPayloads: Array<Payload>;
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
            shouldLoadMore: true,
            searchText: undefined,
            filters: undefined,
            lastMarker: undefined,
            account: AccountRepository.getDefaultAccount(),
            transactions: [],
            pendingPayloads: [],
            dataSource: undefined,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { dataSource, account, isLoading, shouldLoadMore, isLoadingMore, filters } = this.state;
        return (
            !isEqual(nextState.dataSource, dataSource) ||
            !isEqual(nextState.isLoading, isLoading) ||
            !isEqual(nextState.isLoadingMore, isLoadingMore) ||
            !isEqual(nextState.shouldLoadMore, shouldLoadMore) ||
            !isEqual(nextState.account, account) ||
            !isEqual(nextState.filters, filters)
        );
    }

    componentDidMount = () => {
        // add listener for default account change
        AccountRepository.on('changeDefaultAccount', this.onDefaultAccountChange);

        // listen for screen appear event
        Navigation.events().bindComponent(this);

        // update list on transaction received
        LedgerService.on('transaction', () => {
            this.updateDataSource();
        });

        // update list on sign request received
        PushNotificationsService.on('signRequestUpdate', () => {
            this.updateDataSource();
        });
    };

    componentDidAppear() {
        const { account } = this.state;

        // update account details
        InteractionManager.runAfterInteractions(() => {
            if (account.isValid()) {
                this.updateDataSource(true);
            } else {
                this.setState(
                    {
                        account: AccountRepository.getDefaultAccount(),
                    },
                    () => {
                        this.updateDataSource(true);
                    },
                );
            }
        });
    }

    onDefaultAccountChange = (account: AccountSchema) => {
        this.setState(
            {
                account,
                dataSource: undefined,
                transactions: [],
            },
            () => {
                this.updateDataSource();
            },
        );
    };

    loadPendingPayloads = () => {
        return new Promise((resolve) => {
            return BackendService.getPendingPayloads().then((payloads) => {
                this.setState({ pendingPayloads: payloads }, () => {
                    return resolve(payloads);
                });
            });
        });
    };

    loadTransactions = (loadMore?: boolean): Promise<TransactionsType[]> => {
        const { account, lastMarker } = this.state;

        return new Promise((resolve) => {
            // return if no account exist
            if (isEmpty(account)) {
                return resolve([]);
            }

            return LedgerService.getTransactions(account.address, loadMore && lastMarker, 100)
                .then((resp) => {
                    const { transactions, marker } = resp;
                    let shouldLoadMore = true;

                    // if we got less than 20 transaction, means there is no transaction
                    if (transactions.length < 100) {
                        shouldLoadMore = false;
                    }

                    const parsedList = flatMap(transactions, parserFactory);

                    const filtered = filter(parsedList, (t) => {
                        return t.TransactionResult.success;
                    });

                    this.setState({ transactions: filtered, lastMarker: marker, shouldLoadMore }, () => {
                        return resolve(filtered);
                    });
                })
                .catch(() => {
                    Toast(Localize.t('events.canNotFetchTransactions'));
                    return resolve([]);
                });
        });
    };

    loadMore = async () => {
        const { pendingPayloads, shouldLoadMore, filters, searchText, transactions, isLoadingMore } = this.state;

        if (isLoadingMore || !shouldLoadMore || filters || searchText) return;

        this.setState({ isLoadingMore: true });

        const moreTransactions = await this.loadTransactions(true);

        const mixedTransactions = uniqBy([...transactions, ...moreTransactions], 'Hash');

        this.setState({
            isLoadingMore: false,
            transactions: mixedTransactions,
            dataSource: this.buildDataSource(mixedTransactions, pendingPayloads),
        });
    };

    buildDataSource = (transactions: any, pendingPayloads: any) => {
        if (isEmpty(pendingPayloads) && isEmpty(transactions)) {
            return [];
        }

        if (isEmpty(pendingPayloads)) {
            // group items by month name and then get the name for each month
            const grouped = groupBy(transactions, (item) => moment(item.Date, 'YYYY-MM-DD').format('YYYY-MM-DD'));

            const dateSource = [] as any;

            map(grouped, (v, k) => {
                dateSource.push({ title: k, type: 'transactions', data: v });
            });

            return dateSource;
        }

        const dateSource = [] as any;

        dateSource.push({ title: Localize.t('global.awaiting'), type: 'requests', data: pendingPayloads });

        // group items by month name and then get the name for each date
        const groupedTransactions = groupBy(transactions, (item) => {
            return moment(item.Date, 'YYYY-MM-DD').format('YYYY-MM-DD');
        });

        map(groupedTransactions, (v, k) => {
            dateSource.push({ title: k, type: 'transactions', data: v });
        });

        return dateSource;
    };

    updateDataSource = async (background = false) => {
        const { filters, searchText } = this.state;

        if (!background) {
            this.setState({ isLoading: true });
        }

        // update sources
        await this.loadPendingPayloads();
        await this.loadTransactions();

        const { isLoading } = this.state;

        if (isLoading) {
            this.setState({ isLoading: false });
        }

        // apply any new search ad filter to the new sources
        if (searchText) {
            this.onSearchChange(searchText);
        } else {
            this.applyFilters(filters);
        }
    };

    applyFilters = (filters: FilterProps) => {
        const { account, transactions, pendingPayloads } = this.state;

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
                dataSource: this.buildDataSource(transactions, pendingPayloads),
                filters: undefined,
            });
            return;
        }

        let newTransactions = transactions;

        if (filters.Amount && filters.AmountIndicator) {
            newTransactions = filter(newTransactions, (t) => {
                if (filters.AmountIndicator === 'Bigger') {
                    return parseFloat(get(t, 'Amount.value')) >= parseFloat(filters.Amount);
                }
                return parseFloat(get(t, 'Amount.value')) <= parseFloat(filters.Amount);
            });
        }

        if (filters.Currency) {
            newTransactions = filter(newTransactions, (t) => {
                return get(t, 'Amount.currency') === filters.Currency;
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
                    includeTypes.push(...['EscrowCancel', 'EscrowCreate', 'EscrowFinish']);
                    break;
                case 'Offer':
                    includeTypes.push(...['OfferCancel', 'OfferCreate']);
                    break;
                case 'Other':
                    includeTypes.push(
                        ...[
                            'AccountSet',
                            'CheckCancel',
                            'CheckCash',
                            'CheckCreate',
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

        this.setState({
            dataSource: this.buildDataSource(newTransactions, []),
            filters,
        });
    };

    onSearchChange = (text: string) => {
        const { pendingPayloads, transactions } = this.state;

        if (isEmpty(text)) {
            this.setState({
                searchText: '',
                dataSource: this.buildDataSource(transactions, pendingPayloads),
            });
            return;
        }

        const payloadFilter = new Fuse(pendingPayloads, {
            keys: ['application.name'],
            shouldSort: false,
            includeScore: false,
        });

        const newPendingPayloads = flatMap(payloadFilter.search(text), 'item');

        const transactionFilter = new Fuse(transactions, {
            keys: [
                'Account.address',
                'Destination.address',
                'Destination.name',
                'Destination.tag',
                'Amount.value',
                'Amount.currency',
                'Hash',
            ],
            shouldSort: false,
            includeScore: false,
        });
        const newTransactions = flatMap(transactionFilter.search(text), 'item');

        this.setState({
            searchText: text,
            dataSource: this.buildDataSource(newTransactions, newPendingPayloads),
            filters: undefined,
        });
    };

    renderSectionHeader = ({ section: { title, type } }: any) => {
        if (type === 'requests') {
            return (
                <View style={[styles.sectionHeader]}>
                    <Text style={[AppStyles.pbold]}>{title}</Text>
                </View>
            );
        }

        if (type === 'transactions') {
            return (
                <View style={[styles.sectionHeader]}>
                    <Text style={AppStyles.pbold}>{NormalizeDate(title)}</Text>
                </View>
            );
        }

        return null;
    };

    renderHeader = () => {
        const { filters } = this.state;

        if (!filters) return null;

        return (
            <View style={[AppStyles.paddingTopSml, styles.row]}>
                {Object.keys(filters).map((key) => {
                    if (!filters[key] || key === 'Amount') return null;
                    if (key === 'AmountIndicator' && !filters.Amount) return null;

                    let value = filters[key];
                    const keys = [key];

                    if (key === 'AmountIndicator' && filters.Amount) {
                        value = filters[key] === 'Smaller' ? '< ' : '> ';
                        value += filters.Amount;
                        keys.push('Amount');

                        if (filters.Currency) {
                            value += ` ${filters.Currency}`;
                            keys.push('Currency');
                        }
                    }

                    if (key === 'Currency' && filters.Amount && filters.AmountIndicator) {
                        return null;
                    }

                    // get translation text for transaction types and expense Type
                    if (key === 'TransactionType' || key === 'ExpenseType') {
                        value = Localize.t(`global.${filters[key].toLowerCase()}`);
                    }

                    return (
                        <Button
                            onPress={() => {
                                /* eslint-disable-next-line */
                                const f = Object.assign({}, filters);
                                keys.forEach((k) => {
                                    f[k] = undefined;
                                });
                                this.applyFilters(f);
                            }}
                            roundedSmall
                            style={[styles.optionsButton]}
                            textStyle={[styles.optionsButtonText]}
                            label={value}
                            iconStyle={AppStyles.imgColorWhite}
                            icon="IconX"
                            iconPosition="right"
                        />
                    );
                })}
            </View>
        );
    };

    renderItem = ({ section, item }: { section: any; item: any }): React.ReactElement => {
        const { account } = this.state;

        const passProps = { item, account };

        if (section.type === 'requests') {
            return React.createElement(Templates.Request, passProps);
        }
        return React.createElement(Templates.Transaction, passProps);
    };

    renderFooter = () => {
        const { isLoadingMore } = this.state;
        if (isLoadingMore) {
            return <ActivityIndicator color={AppColors.blue} />;
        }
        return null;
    };

    listEmpty = () => {
        const { isLoading, dataSource } = this.state;

        if (isLoading && typeof dataSource === 'undefined') {
            return (
                <View style={styles.listEmptyContainer}>
                    <ActivityIndicator color={AppColors.blue} />
                </View>
            );
        }

        return (
            <View style={styles.listEmptyContainer}>
                <Text style={[AppStyles.pbold]}>{Localize.t('events.noTransaction')}</Text>
            </View>
        );
    };

    render() {
        const { dataSource, isLoading, filters, account } = this.state;

        if (isEmpty(account)) {
            return (
                <SafeAreaView testID="events-tab-empty-view" style={[AppStyles.tabContainer]}>
                    {/* Header */}
                    <View style={[AppStyles.headerContainer]}>
                        <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                            <Text style={AppStyles.h3}>{Localize.t('global.events')}</Text>
                        </View>
                    </View>
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
        }
        return (
            <SafeAreaView testID="events-tab-view" style={[AppStyles.tabContainer, styles.container]}>
                {/* Header */}
                <View style={[AppStyles.headerContainer]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeft, AppStyles.centerContent]}>
                        <Text style={AppStyles.h3}>{Localize.t('global.events')}</Text>
                    </View>
                    <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                        <TouchableOpacity
                            style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.padding]}
                            onPress={() => {
                                Navigator.showModal(
                                    AppScreens.Modal.FilterEvents,
                                    {},
                                    {
                                        currentFilters: filters,
                                        onApply: this.applyFilters,
                                    },
                                );
                            }}
                        >
                            <Icon size={27} style={[styles.filterIcon]} name="IconFilter" />
                        </TouchableOpacity>
                    </View>
                </View>
                {/* Content */}
                <View style={[AppStyles.flex8, AppStyles.stretchSelf]}>
                    <View style={[AppStyles.paddingHorizontalSml]}>
                        <SearchBar onChangeText={this.onSearchChange} placeholder={Localize.t('global.search')} />
                    </View>
                    <SectionList
                        contentContainerStyle={[styles.sectionListContainer]}
                        sections={dataSource}
                        onRefresh={this.updateDataSource}
                        renderItem={this.renderItem}
                        ListHeaderComponent={this.renderHeader}
                        renderSectionHeader={this.renderSectionHeader}
                        refreshing={isLoading}
                        keyExtractor={(item) => item.Hash || item.meta.uuid}
                        ListEmptyComponent={this.listEmpty}
                        onEndReached={this.loadMore}
                        onEndReachedThreshold={0.2}
                        ListFooterComponent={this.renderFooter}
                        // getItemLayout={(_, index) => ({
                        //     length: ITEM_HEIGHT,
                        //     offset: ITEM_HEIGHT * index,
                        //     index,
                        // })}
                        windowSize={10}
                        maxToRenderPerBatch={10}
                        initialNumToRender={20}
                    />
                </View>
            </SafeAreaView>
        );
    }
}

/* Export Component ==================================================================== */
export default EventsView;
