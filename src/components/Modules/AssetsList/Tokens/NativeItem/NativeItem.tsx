import { has } from 'lodash';
import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { BackendService } from '@services';

import { CalculateAvailableBalance, CalculateTotalReserve } from '@common/utils/balance';
import { Toast } from '@common/helpers/interface';

import { CoreRepository } from '@store/repositories';
import { AccountSchema, CoreSchema } from '@store/schemas/latest';

import { AmountText, Icon, TokenAvatar, TouchableDebounce } from '@components/General';

import Localize from '@locale';

import { AppStyles, AppSizes } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    account: AccountSchema;
    discreetMode: boolean;
    reorderEnabled: boolean;
    onPress?: () => void;
}

interface State {
    showReservePanel: boolean;
    currency: string;
    showRate: boolean;
    isLoadingRate: boolean;
    currencyRate: any;
}

/* Component ==================================================================== */
class NativeItem extends PureComponent<Props, State> {
    static Height = AppSizes.scale(45);

    constructor(props: Props) {
        super(props);

        const coreSettings = CoreRepository.getSettings();

        this.state = {
            showReservePanel: coreSettings.showFiatPanel,
            currency: coreSettings.currency,
            showRate: false,
            isLoadingRate: false,
            currencyRate: undefined,
        };
    }

    componentDidMount() {
        // add listener for changes on currency and showReservePanel setting
        CoreRepository.on('updateSettings', this.onCoreSettingsUpdate);
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.onCoreSettingsUpdate);
    }

    onCoreSettingsUpdate = (coreSettings: CoreSchema, changes: Partial<CoreSchema>) => {
        const { currency, showReservePanel } = this.state;

        // currency changed
        if (has(changes, 'currency') && currency !== changes.currency) {
            this.setState({
                showRate: false,
                currencyRate: undefined,
                currency: coreSettings.currency,
            });
        }

        // show reserve panel changed
        if (has(changes, 'showFiatPanel') && showReservePanel !== changes.showFiatPanel) {
            this.setState({
                showRate: false,
                currencyRate: undefined,
                showReservePanel: coreSettings.showFiatPanel,
            });
        }
    };

    fetchCurrencyRate = () => {
        const { currency, isLoadingRate } = this.state;

        if (!isLoadingRate) {
            this.setState({
                isLoadingRate: true,
            });
        }

        BackendService.getCurrencyRate(currency)
            .then((rate: any) => {
                this.setState({
                    currencyRate: rate,
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
        const { showRate } = this.state;

        this.setState({
            showRate: !showRate,
        });

        // fetch the rate again if show rate is true
        if (!showRate) {
            this.fetchCurrencyRate();
        }
    };

    onPress = () => {
        const { onPress } = this.props;

        if (typeof onPress === 'function') {
            onPress();
        }
    };

    getAvatar = () => {
        return <TokenAvatar token="XRP" border size={35} containerStyle={styles.brandAvatar} />;
    };

    getCurrencyAvatar = () => {
        const { discreetMode } = this.props;

        return (
            <View style={styles.currencyAvatarContainer}>
                <Icon
                    size={12}
                    style={[styles.currencyAvatar, discreetMode && AppStyles.imgColorGrey]}
                    name="IconXrp"
                />
            </View>
        );
    };

    getReserveCurrencyAvatar = () => {
        return (
            <View style={styles.reserveCurrencyAvatarContainer}>
                <Icon size={8} style={AppStyles.imgColorGrey} name="IconXrp" />
            </View>
        );
    };

    renderBalance = () => {
        const { account, discreetMode } = this.props;
        const { showRate, currencyRate, isLoadingRate } = this.state;

        const availableBalance = CalculateAvailableBalance(account, true);

        let balance: number;
        let prefix: any;

        if (showRate && currencyRate) {
            balance = Number(availableBalance) * Number(currencyRate.lastRate);
            prefix = `${currencyRate.symbol} `;
        } else {
            balance = availableBalance;
            prefix = this.getCurrencyAvatar;
        }

        return (
            <View style={styles.balanceRow}>
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                    <View style={styles.brandAvatarContainer}>{this.getAvatar()}</View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <Text numberOfLines={1} style={styles.currencyItemLabel}>
                            XRP
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
        const { showRate, showReservePanel, currencyRate, isLoadingRate } = this.state;

        // show fiat panel
        if (!showReservePanel || reorderEnabled) {
            return null;
        }

        let totalReserve: number;
        let prefix: any;

        const accountReserve = CalculateTotalReserve(account);

        if (showRate && currencyRate) {
            totalReserve = Number(accountReserve) * Number(currencyRate.lastRate);
            prefix = `${currencyRate.symbol} `;
        } else {
            totalReserve = accountReserve;
            prefix = this.getReserveCurrencyAvatar;
        }

        return (
            <View style={styles.reserveRow}>
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                    <View style={styles.reserveInfoIconContainer}>
                        <Icon name="IconInfo" size={15} style={AppStyles.imgColorGrey} />
                    </View>
                    <View style={styles.reserveTextContainer}>
                        <Text numberOfLines={1} style={styles.reserveTextLabel}>
                            {Localize.t('home.xrpReserved')}
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
                testID="xrp-currency"
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
