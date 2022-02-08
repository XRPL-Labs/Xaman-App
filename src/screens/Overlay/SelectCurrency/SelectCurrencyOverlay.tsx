/**
 * Select Currency Overlay
 */

import { filter, toLower } from 'lodash';

import React, { Component } from 'react';
import { View, Text, FlatList } from 'react-native';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';
import { NormalizeCurrencyCode } from '@common/utils/amount';

import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

// components
import { TouchableDebounce, Button, ActionPanel, SearchBar, InfoMessage } from '@components/General';
import { CurrencyItem } from '@components/Modules/CurrencyPicker/CurrencyItem';

import Localize from '@locale';

// style
import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    currencies: Array<TrustLineSchema | string>;
    selectedItem?: TrustLineSchema | string;
    onSelect: (currency: TrustLineSchema | string) => void;
    onClose: () => void;
}

export interface State {
    dataSource: Array<TrustLineSchema | string>;
}

/* Component ==================================================================== */
class SelectCurrencyOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.SelectCurrency;

    private actionPanel: ActionPanel;
    private searchBar: SearchBar;

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
    }

    onSelect = (currency: TrustLineSchema | string) => {
        const { onSelect } = this.props;

        if (typeof onSelect === 'function') {
            onSelect(currency);
        }

        if (this.actionPanel) {
            this.actionPanel.slideDown();
        }
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
                return toLower(item).search(text) !== -1;
            }
            return (
                toLower(item.currency.name).search(normalizedSearch) !== -1 ||
                toLower(NormalizeCurrencyCode(item.currency.currency)).search(normalizedSearch) !== -1
            );
        });

        this.setState({
            dataSource: filtered,
        });
    };

    setDefaultDataSource = () => {
        if (this.searchBar) {
            this.searchBar.clearText();
        }
    };

    renderItem = ({ item, index }: { item: TrustLineSchema | string; index: number }) => {
        const { account, selectedItem } = this.props;

        const isSelected =
            // @ts-ignore
            typeof item === 'string' ? selectedItem === item : item.id === selectedItem?.id;
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
                ref={(r) => {
                    this.searchBar = r;
                }}
                onChangeText={this.onFilter}
                placeholder="Search tokens"
                containerStyle={[styles.searchContainer]}
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
                    <View style={[AppStyles.flex1]}>
                        <Button
                            onPress={this.setDefaultDataSource}
                            style={styles.clearSearchButton}
                            light
                            roundedSmall
                            label={Localize.t('global.clearSearch')}
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
                ref={(r) => {
                    this.actionPanel = r;
                }}
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
                            onPress={() => {
                                this.actionPanel?.slideDown();
                            }}
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
