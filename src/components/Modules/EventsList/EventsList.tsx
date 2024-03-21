import React, { PureComponent } from 'react';
import { View, Text, RefreshControl, SectionList } from 'react-native';

import { AccountModel } from '@store/models';

import StyleService from '@services/StyleService';

import { Payload } from '@common/libs/payload';

import { Transactions } from '@common/libs/ledger/transactions/types';
import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { InstanceTypes } from '@common/libs/ledger/types/enums';

import { LoadingIndicator } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import * as EventListItems from './EventListItems';
/* Types ==================================================================== */
export type RowItemType = (Transactions & MutationsMixinType) | LedgerObjects | Payload;

export type DataSourceItem = {
    data: Array<RowItemType>;
    header: string;
};

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

    renderSectionHeader = ({ section: { header } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeaderText, styles.sectionHeaderDateText]}>{header}</Text>
            </View>
        );
    };

    renderItem = ({ item }: { item: RowItemType }): React.ReactElement | null => {
        const { account, timestamp } = this.props;

        if (item instanceof Payload) {
            return React.createElement(EventListItems.Request, {
                item,
                account,
                timestamp,
            });
        }
        if ([InstanceTypes.GenuineTransaction, InstanceTypes.FallbackTransaction].includes(item.InstanceType)) {
            return React.createElement(EventListItems.Transaction, {
                item,
                account,
                timestamp,
            } as {
                item: Transactions & MutationsMixinType;
                account: AccountModel;
                timestamp: number | undefined;
            });
        }
        if (item.InstanceType === InstanceTypes.LedgerObject) {
            return React.createElement(EventListItems.LedgerObject, {
                item,
                account,
                timestamp,
            } as {
                item: LedgerObjects & MutationsMixinType;
                account: AccountModel;
                timestamp: number | undefined;
            });
        }
        return null;
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
            <RefreshControl
                refreshing={!!isLoading}
                onRefresh={onRefresh}
                tintColor={StyleService.value('$contrast')}
            />
        );
    };

    keyExtractor = (item: any, index: number): string => {
        let key = '';
        if ([InstanceTypes.GenuineTransaction, InstanceTypes.FallbackTransaction].includes(item.InstanceType)) {
            key = `${item.hash}`;
        } else if (item.InstanceType === InstanceTypes.LedgerObject) {
            key = `${item.Index}`;
        } else if (item instanceof Payload) {
            key = `${item.getPayloadUUID()}`;
        }

        return `row-item-${index}-${key}`;
    };

    render() {
        const { dataSource, onEndReached, headerComponent } = this.props;

        return (
            <SectionList
                style={styles.sectionList}
                contentContainerStyle={styles.sectionListContainer}
                sections={dataSource}
                renderItem={this.renderItem}
                renderSectionHeader={this.renderSectionHeader}
                keyExtractor={this.keyExtractor}
                ListEmptyComponent={this.renderListEmpty}
                ListHeaderComponent={headerComponent}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.2}
                ListFooterComponent={this.renderFooter}
                windowSize={10}
                maxToRenderPerBatch={10}
                initialNumToRender={20}
                refreshControl={this.renderRefreshControl()}
                indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
                stickySectionHeadersEnabled={false}
            />
        );
    }
}

export default EventsList;
