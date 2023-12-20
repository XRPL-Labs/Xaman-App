import React, { PureComponent } from 'react';
import { View, Text, RefreshControl } from 'react-native';

import { FlashList } from '@shopify/flash-list';

import { AccountModel } from '@store/models';

import StyleService from '@services/StyleService';

import { Payload } from '@common/libs/payload';
import { BaseTransaction } from '@common/libs/ledger/transactions';
import { BaseLedgerObject } from '@common/libs/ledger/objects';

import { LoadingIndicator } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import * as EventListItems from './EventListItems';
/* Types ==================================================================== */
export enum DataSourceItemType {
    'RowItem' = 'RowItem',
    'SectionHeader' = 'SectionHeader',
}

export type RowDataSourceItem = {
    data: BaseTransaction | BaseLedgerObject | Payload;
    type: DataSourceItemType.RowItem;
};

export type SectionHeaderDataSourceItem = {
    data: string;
    type: DataSourceItemType.SectionHeader;
};

export type DataSourceItem = RowDataSourceItem | SectionHeaderDataSourceItem;

interface Props {
    account: AccountModel;
    isLoading?: boolean;
    isLoadingMore?: boolean;
    dataSource: Array<DataSourceItem>;
    headerComponent?: any;
    timestamp?: number;
    onRefresh?: () => void;
    onEndReached?: () => void;
}

/* Component ==================================================================== */
class EventsList extends PureComponent<Props> {
    renderListEmpty = () => {
        const { isLoading } = this.props;

        if (isLoading) {
            return (
                <View style={styles.listEmptyContainer}>
                    <LoadingIndicator />
                </View>
            );
        }

        return (
            <View style={styles.listEmptyContainer}>
                <Text style={AppStyles.pbold}>{Localize.t('global.noInformationToShow')}</Text>
            </View>
        );
    };

    renderSectionHeader = (data: string) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeaderText, styles.sectionHeaderDateText]}>{data}</Text>
            </View>
        );
    };

    renderItem = ({ item }: { item: DataSourceItem }): React.ReactElement => {
        const { account, timestamp } = this.props;

        const { data, type } = item;

        switch (type) {
            case DataSourceItemType.SectionHeader:
                return this.renderSectionHeader(data);
            case DataSourceItemType.RowItem: {
                const passProps = { item: data, account, timestamp };
                if (data instanceof Payload) {
                    // @ts-ignore
                    return React.createElement(EventListItems.Request, passProps);
                }
                if (data instanceof BaseTransaction) {
                    // @ts-ignore
                    return React.createElement(EventListItems.Transaction, passProps);
                }
                if (data instanceof BaseLedgerObject) {
                    // @ts-ignore
                    return React.createElement(EventListItems.LedgerObject, passProps);
                }
                return null;
            }
            default:
                return null;
        }
    };

    renderFooter = () => {
        const { isLoadingMore } = this.props;

        if (isLoadingMore) {
            return <LoadingIndicator />;
        }
        return null;
    };

    renderRefreshControl = () => {
        const { isLoading, onRefresh } = this.props;

        return (
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={StyleService.value('$contrast')} />
        );
    };

    keyExtractor = ({ type }: DataSourceItem, index: number): string => {
        switch (type) {
            case DataSourceItemType.RowItem:
                return `row-item-${index}`;
            case DataSourceItemType.SectionHeader:
                return `header-${index}`;
            default:
                return `item-${index}`;
        }
    };

    // stickyHeaderIndices = () => {
    //     const { dataSource } = this.props;
    //     return dataSource
    //         .map((item, index) => {
    //             if (item.type === DataSourceItemType.SectionHeader) {
    //                 return index;
    //             }
    //             return null;
    //         })
    //         .filter((item) => item !== null) as number[];
    // };

    getItemType = (item: DataSourceItem) => {
        return item.type;
    };

    render() {
        const { dataSource, onEndReached, headerComponent } = this.props;

        return (
            <View style={styles.sectionList}>
                <FlashList
                    data={dataSource}
                    renderItem={this.renderItem}
                    estimatedItemSize={EventListItems.Transaction.Height}
                    contentContainerStyle={styles.sectionListContainer}
                    onEndReached={onEndReached}
                    onEndReachedThreshold={0.2}
                    ListEmptyComponent={this.renderListEmpty}
                    ListHeaderComponent={headerComponent}
                    ListFooterComponent={this.renderFooter()}
                    keyExtractor={this.keyExtractor}
                    getItemType={this.getItemType}
                    refreshControl={this.renderRefreshControl()}
                    indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
                />
            </View>
        );
    }
}

export default EventsList;
