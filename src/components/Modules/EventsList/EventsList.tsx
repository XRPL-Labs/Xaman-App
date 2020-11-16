import moment from 'moment-timezone';

import React, { PureComponent } from 'react';
import { View, Text, SectionList, ActivityIndicator } from 'react-native';

import { AccountSchema } from '@store/schemas/latest';

import Localize from '@locale';

import { AppStyles, AppColors } from '@theme';
import styles from './styles';

// EventListItems
import * as EventListItems from './EventListItems';

/* Types ==================================================================== */
interface Props {
    account: AccountSchema;
    isLoading?: boolean;
    isLoadingMore?: boolean;
    dataSource: any;
    headerComponent?: any;
    onRefresh?: () => void;
    onEndReached?: () => void;
}

/* Component ==================================================================== */
class EventsList extends PureComponent<Props> {
    formatDate = (date: string) => {
        const momentDate = moment(date);
        const reference = moment();
        const today = reference.clone().startOf('day');
        const yesterday = reference.clone().subtract(1, 'days').startOf('day');

        if (momentDate.isSame(today, 'day')) {
            return 'Today';
        }
        if (momentDate.isSame(yesterday, 'day')) {
            return 'Yesterday';
        }

        // same year, don't show year
        if (momentDate.isSame(reference, 'year')) {
            return momentDate.format('DD MMM');
        }

        return momentDate.format('DD MMM, Y');
    };

    listEmpty = () => {
        const { isLoading, dataSource } = this.props;

        if (isLoading && typeof dataSource === 'undefined') {
            return (
                <View style={styles.listEmptyContainer}>
                    <ActivityIndicator color={AppColors.blue} />
                </View>
            );
        }

        return (
            <View style={styles.listEmptyContainer}>
                <Text style={[AppStyles.pbold]}>{Localize.t('global.noInformationToShow')}</Text>
            </View>
        );
    };

    renderItem = ({ item }: { item: any }): React.ReactElement => {
        const { account } = this.props;

        const passProps = { item, account };

        switch (item.ClassName) {
            case 'Payload':
                return React.createElement(EventListItems.Request, passProps);
            case 'Transaction':
                return React.createElement(EventListItems.Transaction, passProps);
            case 'LedgerObject':
                return React.createElement(EventListItems.LedgerObject, passProps);
            default:
                return null;
        }
    };

    renderFooter = () => {
        const { isLoadingMore } = this.props;

        if (isLoadingMore) {
            return <ActivityIndicator color={AppColors.blue} />;
        }
        return null;
    };

    renderSectionHeader = ({ section: { title, type } }: any) => {
        return (
            <View style={[styles.sectionHeader]}>
                <Text style={[styles.sectionHeaderText, type === 'date' && styles.sectionHeaderDateText]}>
                    {type === 'date' ? this.formatDate(title) : title}
                </Text>
            </View>
        );
    };

    render() {
        const { dataSource, isLoading, onRefresh, onEndReached, headerComponent } = this.props;

        return (
            <SectionList
                style={styles.sectionList}
                contentContainerStyle={[styles.sectionListContainer]}
                sections={dataSource}
                onRefresh={onRefresh}
                renderItem={this.renderItem}
                renderSectionHeader={this.renderSectionHeader}
                refreshing={isLoading}
                keyExtractor={(item) => item.Hash || item.meta?.uuid || item.Index}
                ListEmptyComponent={this.listEmpty}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.2}
                ListFooterComponent={this.renderFooter}
                windowSize={10}
                maxToRenderPerBatch={10}
                initialNumToRender={20}
                ListHeaderComponent={headerComponent}
            />
        );
    }
}

export default EventsList;
