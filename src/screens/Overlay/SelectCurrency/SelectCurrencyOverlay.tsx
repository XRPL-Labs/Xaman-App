/**
 * Select Currency Overlay
 */

import { filter, toLower } from 'lodash';

import React, { Component } from 'react';
import { View, Text, FlatList } from 'react-native';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { NormalizeCurrencyCode } from '@common/utils/amount';

import { AccountModel, TrustLineModel } from '@store/models';

// components
import { TouchableDebounce, Button, ActionPanel, SearchBar, InfoMessage } from '@components/General';
import { CurrencyItem } from '@components/Modules/CurrencyPicker/CurrencyItem';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
    currencies: Array<TrustLineModel | string>;
    selectedItem?: TrustLineModel | string;
    onSelect: (currency: TrustLineModel | string) => void;
    onClose: () => void;
}

export interface State {
    dataSource: Array<TrustLineModel | string>;
}

/* Component ==================================================================== */
class SelectCurrencyOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SelectCurrency;

    private actionPanelRef: React.RefObject<ActionPanel>;
    private searchBarRef: React.RefObject<SearchBar>;

    static options() {
        return {
            statusBar: {
                visible: true,
                style: 'light',
            },
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            dataSource: props.currencies,
        };

        this.actionPanelRef = React.createRef();
        this.searchBarRef = React.createRef();
    }

    onSelect = (currency: TrustLineModel | string) => {
        const { onSelect } = this.props;

        if (typeof onSelect === 'function') {
            onSelect(currency);
        }

        this.actionPanelRef?.current?.slideDown();
    };

    onClose = () => {
        const { onClose } = this.props;

        if (typeof onClose === 'function') {
            onClose();
        }

        Navigator.dismissOverlay();
    };

    onFilter = (text: string) => {
        const { currencies } = this.props;

        if (!text) {
            this.setState({
                dataSource: currencies,
            });
            return;
        }

        const normalizedSearch = toLower(text);

        const filtered = filter(currencies, (item: any) => {
            if (typeof item === 'string') {
                return toLower(item).indexOf(text) !== -1;
            }
            return (
                toLower(item.currency.name).indexOf(normalizedSearch) !== -1 ||
                toLower(item.counterParty?.name).indexOf(normalizedSearch) > -1 ||
                toLower(NormalizeCurrencyCode(item.currency.currency)).indexOf(normalizedSearch) !== -1
            );
        });

        this.setState({
            dataSource: filtered,
        });
    };

    setDefaultDataSource = () => {
        this.searchBarRef?.current?.clearText();
    };

    onCancelPress = () => {
        this.actionPanelRef?.current?.slideDown();
    };

    isItemSelected = (item: TrustLineModel | string, selectedItem: TrustLineModel | string | undefined): boolean => {
        if (typeof item === 'string' && typeof selectedItem === 'string') {
            return selectedItem === item;
        }

        if (typeof item !== 'string' && typeof selectedItem !== 'string') {
            return item.id === selectedItem?.id;
        }

        return false;
    };

    renderItem = ({ item, index }: { item: TrustLineModel | string; index: number }) => {
        const { account, selectedItem } = this.props;

        const isSelected = this.isItemSelected(item, selectedItem);

        return (
            <TouchableDebounce
                key={index}
                onPress={() => {
                    this.onSelect(item);
                }}
                activeOpacity={0.9}
            >
                <View
                    style={[
                        AppStyles.row,
                        AppStyles.centerAligned,
                        styles.itemRow,
                        isSelected && styles.itemRowSelected,
                    ]}
                >
                    <CurrencyItem account={account} item={item} selected={isSelected} />
                    <View style={[AppStyles.flex1]}>
                        <View
                            style={[isSelected ? styles.radioCircleSelected : styles.radioCircle, AppStyles.rightSelf]}
                        />
                    </View>
                </View>
            </TouchableDebounce>
        );
    };

    renderListHeaderComponent = () => {
        return (
            <SearchBar
                ref={this.searchBarRef}
                onChangeText={this.onFilter}
                placeholder={Localize.t('global.searchTokens')}
                containerStyle={styles.searchContainer}
            />
        );
    };

    renderListEmptyComponent = () => {
        return (
            <>
                <View style={[styles.sectionHeader, AppStyles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('send.searchResults')}</Text>
                    </View>
                    <View style={AppStyles.flex1}>
                        <Button
                            onPress={this.setDefaultDataSource}
                            style={styles.clearSearchButton}
                            label={Localize.t('global.clearSearch')}
                            light
                            roundedSmall
                        />
                    </View>
                </View>
                <View style={AppStyles.paddingVerticalSml}>
                    <InfoMessage type="warning" label={Localize.t('send.noSearchResult')} />
                </View>
            </>
        );
    };

    render() {
        const { dataSource } = this.state;

        return (
            <ActionPanel
                height={AppSizes.heightPercentageToDP(90)}
                onSlideDown={this.onClose}
                ref={this.actionPanelRef}
            >
                <View style={[AppStyles.row, AppStyles.centerAligned, AppStyles.paddingBottomSml]}>
                    <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                        <Text numberOfLines={1} style={[AppStyles.h5]}>
                            {Localize.t('global.assets')}
                        </Text>
                    </View>
                    <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                        <Button
                            numberOfLines={1}
                            light
                            roundedSmall
                            isDisabled={false}
                            onPress={this.onCancelPress}
                            textStyle={[AppStyles.subtext, AppStyles.bold]}
                            label={Localize.t('global.cancel')}
                        />
                    </View>
                </View>

                <FlatList
                    data={dataSource}
                    renderItem={this.renderItem}
                    ListHeaderComponent={this.renderListHeaderComponent}
                    ListEmptyComponent={this.renderListEmptyComponent}
                    keyExtractor={(item, index) => `${index}`}
                    stickyHeaderIndices={[0]}
                    contentContainerStyle={styles.listContainer}
                    // bounces={false}
                />
            </ActionPanel>
        );
    }
}

/* Export Component ==================================================================== */
export default SelectCurrencyOverlay;
