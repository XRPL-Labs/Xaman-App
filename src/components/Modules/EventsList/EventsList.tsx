import React, { PureComponent } from 'react';
// import { View, Text, RefreshControl, SectionList, InteractionManager } from 'react-native';
import { View, Text, RefreshControl, SectionList } from 'react-native';

import has from 'lodash/has';

import StyleService from '@services/StyleService';
// import BackendService, { RatesType } from '@services/BackendService';
import { type RatesType } from '@services/BackendService';

import { CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel } from '@store/models';

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

interface State {
    fiatCurrency?: string;
    fiatRate?: RatesType | undefined;
    isLoadingRate?: boolean;
}

interface Props {
    account: AccountModel;
    isLoading?: boolean;
    isVisible?: boolean;
    isLoadingMore?: boolean;
    dataSource: Array<DataSourceItem>;
    headerComponent?: any;
    timestamp?: number;
    onRefresh?: () => void;
    onEndReached?: () => void;
}

/* Component ==================================================================== */
class EventsList extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            fiatCurrency: coreSettings.currency,
            // fiatRate: undefined,
            // isLoadingRate: false,
        };
    }

    renderListEmpty = () => {
        const { isLoading } = this.props;

        // // This fixes the double spinner on loading @ Event list
        // if (isLoading) {
        //     return (
        //         <View style={[styles.listEmptyContainer]}>
        //             <LoadingIndicator />
        //         </View>
        //     );
        // }

        return (
            <View style={styles.listEmptyContainer}>
                <Text style={AppStyles.pbold}>{
                    !isLoading
                        ? Localize.t('global.noInformationToShow')
                        : ' ' // Localize.t('global.loading')
                }</Text>
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
        // const { fiatCurrency, fiatRate, isLoadingRate } = this.state;

        // console.log('renderItem')

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
                // rates: { fiatCurrency, fiatRate, isLoadingRate },
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
        const { isLoading, onRefresh, isVisible } = this.props;

        return (
            <RefreshControl
                refreshing={!!isLoading && !!isVisible}
                onRefresh={onRefresh}
                tintColor={StyleService.value('$contrast')}
            />
        );
    };

    componentDidMount() {
        // add listener for changes on currency and showReservePanel setting
        CoreRepository.on('updateSettings', this.onCoreSettingsUpdate);
        // this.fetchCurrencyRate();
    }
    
    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.onCoreSettingsUpdate);
    }

    onCoreSettingsUpdate = (coreSettings: CoreModel, changes: Partial<CoreModel>) => {
        const { fiatCurrency } = this.state;

        // currency changed
        if (has(changes, 'currency') && fiatCurrency !== changes.currency) {
            this.setState({
                // fiatRate: undefined,
                fiatCurrency: coreSettings.currency,
            });
        }

        // default network changed
        // if (has(changes, 'network')) {
        //     // clean up rate
        //     this.setState({
        //         fiatRate: undefined,
        //     });

        //     InteractionManager.runAfterInteractions(this.fetchCurrencyRate);
        // }
    };

    // fetchCurrencyRate = () => {
    //     const { fiatCurrency, isLoadingRate } = this.state;

    //     if (!isLoadingRate) {
    //         this.setState({
    //             isLoadingRate: true,
    //         });
    //     }

    //     BackendService.getCurrencyRate(fiatCurrency)
    //         .then((rate: any) => {
    //             this.setState({
    //                 fiatRate: rate,
    //                 isLoadingRate: false,
    //             });
    //         })
    //         .catch(() => {
    //             // Toast(Localize.t('global.unableToFetchCurrencyRate'));
    //             this.setState({
    //                 isLoadingRate: false,
    //             });
    //         });
    // };

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
        const { dataSource, onEndReached, headerComponent, isLoading } = this.props;
        
        const renderSeparateLoadingIndicator = !!isLoading && (dataSource || []).length === 0;

        return (
            <>
                { renderSeparateLoadingIndicator &&
                    <View style={[styles.listEmptyContainer]}>
                        <LoadingIndicator />
                        <Text>{' '}</Text>
                        <Text>{' '}</Text>
                    </View>        
                }
                { !renderSeparateLoadingIndicator && 
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
                }
            </>
        );
    }
}

export default EventsList;
