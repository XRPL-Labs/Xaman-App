import moment from 'moment-timezone';

import React, { PureComponent } from 'react';
import { View, Text, SectionList, RefreshControl } from 'react-native';

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
interface Props {
    account: AccountModel;
    isLoading?: boolean;
    isLoadingMore?: boolean;
    dataSource: any;
    headerComponent?: any;
    timestamp?: number;
    onRefresh?: () => void;
    onEndReached?: () => void;
}

/* Component ==================================================================== */
class EventsList extends PureComponent<Props> {
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

    renderItem = ({ item }: { item: any }): React.ReactElement => {
        const { account, timestamp } = this.props;

        const passProps = { item, account, timestamp };

        switch (true) {
            case item instanceof Payload:
                return React.createElement(EventListItems.Request, passProps);
            case item instanceof BaseTransaction:
                return React.createElement(EventListItems.Transaction, passProps);
            case item instanceof BaseLedgerObject:
                return React.createElement(EventListItems.LedgerObject, passProps);
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

    renderSectionHeader = ({ section: { title, type } }: any) => {
        return (
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeaderText, type === 'date' && styles.sectionHeaderDateText]}>
                    {type === 'date' ? this.formatDate(title) : title}
                </Text>
            </View>
        );
    };

    render() {
        const { isLoading, onRefresh, dataSource, onEndReached, headerComponent } = this.props;

        return (
            <SectionList
                style={styles.sectionList}
                contentContainerStyle={styles.sectionListContainer}
                sections={dataSource}
                renderItem={this.renderItem}
                renderSectionHeader={this.renderSectionHeader}
                keyExtractor={(item) => item.Hash || item.meta?.uuid || item.Index}
                ListEmptyComponent={this.renderListEmpty}
                ListHeaderComponent={headerComponent}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.2}
                ListFooterComponent={this.renderFooter}
                windowSize={10}
                maxToRenderPerBatch={10}
                initialNumToRender={20}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={onRefresh}
                        tintColor={StyleService.value('$contrast')}
                    />
                }
                indicatorStyle={StyleService.isDarkMode() ? 'white' : 'default'}
            />
        );
    }
}

export default EventsList;
