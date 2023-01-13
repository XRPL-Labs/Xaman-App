import { has } from 'lodash';
import React, { PureComponent } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import { BackendService } from '@services';

import { CalculateAvailableBalance, CalculateTotalReserve } from '@common/utils/balance';
import { Toast } from '@common/helpers/interface';

import { CoreRepository } from '@store/repositories';
import { AccountSchema, CoreSchema } from '@store/schemas/latest';

import { AmountText, Icon, TokenAvatar, TextPlaceholder, TouchableDebounce } from '@components/General';

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
    showFiatPanel: boolean;
    currency: string;
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
            showFiatPanel: coreSettings.showFiatPanel,
            currency: coreSettings.currency,
            isLoadingRate: true,
            currencyRate: undefined,
        };
    }

    componentDidMount() {
        // add listener for changes on currency and showFiatPanel setting
        CoreRepository.on('updateSettings', this.onCoreSettingsUpdate);

        // load the currency rate
        InteractionManager.runAfterInteractions(this.fetchCurrencyRate);
    }

    componentWillUnmount() {
        CoreRepository.off('updateSettings', this.onCoreSettingsUpdate);
    }

    onCoreSettingsUpdate = (coreSettings: CoreSchema, changes: Partial<CoreSchema>) => {
        const { currency, showFiatPanel } = this.state;

        // currency changed
        if (has(changes, 'currency') && currency !== changes.currency) {
            this.setState(
                {
                    currency: coreSettings.currency,
                },
                this.fetchCurrencyRate,
            );
        }

        // show fiat panel changed
        if (has(changes, 'showFiatPanel') && showFiatPanel !== changes.showFiatPanel) {
            this.setState(
                {
                    showFiatPanel: coreSettings.showFiatPanel,
                },
                this.fetchCurrencyRate,
            );
        }
    };

    fetchCurrencyRate = () => {
        const { showFiatPanel, currency } = this.state;

        // if we are not showing fiat panel return
        if (!showFiatPanel) {
            return;
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

    renderBalance = () => {
        const { account, discreetMode } = this.props;

        const availableBalance = CalculateAvailableBalance(account, true);

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
                <View
                    style={[
                        AppStyles.flex1,
                        AppStyles.row,
                        AppStyles.centerContent,
                        AppStyles.centerAligned,
                        AppStyles.flexEnd,
                    ]}
                >
                    <AmountText
                        testID="account-native-balance"
                        prefix={this.getCurrencyAvatar}
                        value={availableBalance}
                        style={styles.balanceText}
                        discreet={discreetMode}
                        discreetStyle={AppStyles.colorGrey}
                    />
                </View>
            </View>
        );
    };

    renderReserveRate = () => {
        const { account, reorderEnabled, discreetMode } = this.props;
        const { showFiatPanel, currencyRate, isLoadingRate } = this.state;

        // show fiat panel
        if (!showFiatPanel || reorderEnabled) {
            return null;
        }

        let totalReserve = '0';
        let balanceFiat = '0';

        if (discreetMode) {
            balanceFiat = '••••••••';
            totalReserve = '••';
        } else {
            totalReserve = String(CalculateTotalReserve(account));

            if (currencyRate) {
                const availableBalance = CalculateAvailableBalance(account, false);
                balanceFiat = `${currencyRate.symbol} ${Localize.formatNumber(
                    Number(availableBalance) * Number(currencyRate.lastRate),
                    2,
                )}`;
            }
        }

        return (
            <View style={styles.reserveRow}>
                <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                    <View style={styles.reserveInfoIconContainer}>
                        <Icon name="IconInfo" size={15} style={AppStyles.imgColorGrey} />
                    </View>
                    <View style={styles.reserveTextContainer}>
                        <Text numberOfLines={1} style={styles.reserveTextLabel}>
                            {Localize.t('home.xrpReserved', { reserve: totalReserve })}
                        </Text>
                    </View>
                </View>
                <View
                    style={[
                        AppStyles.flex1,
                        AppStyles.row,
                        AppStyles.centerContent,
                        AppStyles.centerAligned,
                        AppStyles.flexEnd,
                    ]}
                >
                    <TextPlaceholder isLoading={isLoadingRate} style={styles.fiatAmountText}>
                        {balanceFiat}
                    </TextPlaceholder>
                </View>
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
                {this.renderReserveRate()}
            </TouchableDebounce>
        );
    }
}

export default NativeItem;
