import has from 'lodash/has';
import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import BackendService, { RatesType } from '@services/BackendService';
import NetworkService from '@services/NetworkService';

import { CalculateAvailableBalance, CalculateTotalReserve } from '@common/utils/balance';
import { Toast } from '@common/helpers/interface';

import { CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel } from '@store/models';

import { AmountText, Icon, TouchableDebounce } from '@components/General';

import { TokenAvatar, TokenIcon } from '@components/Modules/TokenElement';

import Localize from '@locale';

import { AppStyles, AppSizes } from '@theme';
import styles from './styles';
import BigNumber from 'bignumber.js';

/* Types ==================================================================== */
interface Props {
    account: AccountModel;
    discreetMode: boolean;
    reorderEnabled: boolean;
    onPress?: () => void;
}

interface State {
    showReservePanel: boolean;
    fiatCurrency: string;
    fiatRate: RatesType | undefined;
    showFiatRate: boolean;
    isLoadingRate: boolean;
}

/* Component ==================================================================== */
class NativeItem extends Component<Props, State> {
    static Height = AppSizes.scale(45);

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            showReservePanel: coreSettings.showReservePanel,
            fiatCurrency: coreSettings.currency,
            fiatRate: undefined,
            showFiatRate: false,
            isLoadingRate: false,
        };
    }

    componentDidMount() {
        // add listener for changes on currency and showReservePanel setting
        CoreRepository.on('updateSettings', this.onCoreSettingsUpdate);
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.onCoreSettingsUpdate);
    }

    onCoreSettingsUpdate = (coreSettings: CoreModel, changes: Partial<CoreModel>) => {
        const { showFiatRate, fiatCurrency, showReservePanel } = this.state;

        // currency changed
        if (has(changes, 'currency') && fiatCurrency !== changes.currency) {
            this.setState({
                showFiatRate: false,
                fiatRate: undefined,
                fiatCurrency: coreSettings.currency,
            });
        }

        // show reserve panel changed
        if (has(changes, 'showReservePanel') && showReservePanel !== changes.showReservePanel) {
            this.setState({
                showFiatRate: false,
                fiatRate: undefined,
                showReservePanel: coreSettings.showReservePanel,
            });
        }

        // default network changed
        if (has(changes, 'network')) {
            // clean up rate
            this.setState({
                fiatRate: undefined,
            });

            // if already show rate re-fetch the rate with new native asset
            if (showFiatRate) {
                InteractionManager.runAfterInteractions(this.fetchCurrencyRate);
            }
        }
    };

    fetchCurrencyRate = () => {
        const { fiatCurrency, isLoadingRate } = this.state;

        if (!isLoadingRate) {
            this.setState({
                isLoadingRate: true,
            });
        }

        BackendService.getCurrencyRate(fiatCurrency)
            .then((rate: any) => {
                this.setState({
                    fiatRate: rate,
                    isLoadingRate: false,
                });
            })
            .catch(() => {
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
                this.setState({
                    isLoadingRate: false,
                });
            });
    };

    toggleBalance = () => {
        const { showFiatRate } = this.state;

        this.setState({
            showFiatRate: !showFiatRate,
        });

        // fetch the rate again if show rate is true
        if (!showFiatRate) {
            this.fetchCurrencyRate();
        }
    };

    onPress = () => {
        const { onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress();
        }
    };

    getTokenAvatar = () => {
        return <TokenAvatar token="Native" border size={35} />;
    };

    getTokenIcon = () => {
        const { discreetMode } = this.props;

        return (
            <TokenIcon
                token="Native"
                containerStyle={styles.tokenIconContainer}
                style={[styles.tokenIcon, discreetMode ? AppStyles.imgColorGrey : {}]}
            />
        );
    };

    getReserveTokenIcon = () => {
        return (
            <TokenIcon
                token="Native"
                size={8}
                containerStyle={styles.reserveCurrencyAvatarContainer}
                style={AppStyles.imgColorGrey}
            />
        );
    };

    renderBalance = () => {
        const { account, discreetMode } = this.props;
        const { showFiatRate, fiatRate, isLoadingRate } = this.state;

        const availableBalance = CalculateAvailableBalance(account, true);

        let balance: number;
        let prefix: any;

        if (showFiatRate && fiatRate) {
            balance = new BigNumber(availableBalance).multipliedBy(fiatRate.rate).decimalPlaces(2).toNumber();
            prefix = `${fiatRate.symbol} `;
        } else {
            balance = availableBalance;
            prefix = this.getTokenIcon;
        }

        return (
            <View style={styles.balanceRow}>
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                    <View style={styles.tokenAvatarContainer}>{this.getTokenAvatar()}</View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <Text numberOfLines={1} style={styles.currencyItemLabel}>
                            {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </View>
                <TouchableDebounce activeOpacity={0.7} onPress={this.toggleBalance} style={styles.rightContainer}>
                    <AmountText
                        testID="account-native-balance"
                        prefix={prefix}
                        value={balance}
                        style={styles.balanceText}
                        discreet={discreetMode}
                        isLoading={isLoadingRate}
                        discreetStyle={AppStyles.colorGrey}
                        toggleDisabled
                    />
                </TouchableDebounce>
            </View>
        );
    };

    renderReservePanel = () => {
        const { account, reorderEnabled, discreetMode } = this.props;
        const { showFiatRate, showReservePanel, fiatRate, isLoadingRate } = this.state;

        // show fiat panel
        if (!showReservePanel || reorderEnabled) {
            return null;
        }

        let totalReserve: number;
        let prefix: any;

        const accountReserve = CalculateTotalReserve(account);

        if (showFiatRate && fiatRate) {
            totalReserve = new BigNumber(accountReserve).multipliedBy(fiatRate.rate).decimalPlaces(2).toNumber();
            prefix = `${fiatRate.symbol} `;
        } else {
            totalReserve = accountReserve;
            prefix = this.getReserveTokenIcon;
        }

        return (
            <View style={styles.reserveRow}>
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                    <View style={styles.reserveInfoIconContainer}>
                        <Icon name="IconInfo" size={15} style={AppStyles.imgColorGrey} />
                    </View>
                    <View style={styles.reserveTextContainer}>
                        <Text numberOfLines={1} style={styles.reserveTextLabel}>
                            {Localize.t('global.reserved')}
                        </Text>
                    </View>
                </View>
                <TouchableDebounce activeOpacity={0.7} style={styles.rightContainer} onPress={this.toggleBalance}>
                    <AmountText
                        discreet={discreetMode}
                        value={totalReserve}
                        prefix={prefix}
                        isLoading={isLoadingRate}
                        style={styles.reserveTextValue}
                        toggleDisabled
                    />
                </TouchableDebounce>
            </View>
        );
    };

    render() {
        return (
            <TouchableDebounce
                testID="native-currency"
                style={styles.currencyItem}
                onPress={this.onPress}
                activeOpacity={0.7}
            >
                {this.renderBalance()}
                {this.renderReservePanel()}
            </TouchableDebounce>
        );
    }
}

export default NativeItem;
