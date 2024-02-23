/**
 * Request Screen
 */

import { find, first } from 'lodash';
import BigNumber from 'bignumber.js';
import Realm from 'realm';

import React, { Component } from 'react';
import { View, Text, Keyboard, Share, InteractionManager, Platform } from 'react-native';

import BackendService, { RatesType } from '@services/BackendService';

import { Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import { AccountRepository, CoreRepository } from '@store/repositories';
import { AccountModel, CoreModel } from '@store/models';

// components
import {
    TouchableDebounce,
    Header,
    AmountInput,
    QRCode,
    CheckBox,
    HorizontalLine,
    KeyboardAwareScrollView,
} from '@components/General';

import { AmountValueType } from '@components/General/AmountInput';
import { AccountPicker } from '@components/Modules';

// local
import Localize from '@locale';

// style
import { AppStyles, AppColors, AppSizes } from '@theme';
import styles from './styles';

/* types ==================================================================== */
interface Props {}

interface State {
    coreSettings: CoreModel;
    accounts: Realm.Results<AccountModel>;
    source: AccountModel;
    amount?: string;
    amountRate?: string;
    currencyRate?: RatesType;
    withAmount: boolean;
}

/* Component ==================================================================== */
class RequestView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Request;

    amountInputRef: React.RefObject<typeof AmountInput>;
    amountRateInputRef: React.RefObject<typeof AmountInput>;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const defaultAccount = CoreRepository.getDefaultAccount();
        const accounts = AccountRepository.getAccounts();

        this.state = {
            coreSettings: CoreRepository.getSettings(),
            accounts,
            source: find(accounts, { address: defaultAccount.address }) || first(accounts)!,
            amount: undefined,
            currencyRate: undefined,
            amountRate: undefined,
            withAmount: false,
        };

        this.amountInputRef = React.createRef();
        this.amountRateInputRef = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchCurrencyRate);
    }

    fetchCurrencyRate = () => {
        const { coreSettings } = this.state;

        const { currency } = coreSettings;

        BackendService.getCurrencyRate(currency)
            .then((r) => {
                this.setState(
                    {
                        currencyRate: r,
                    },
                    this.onUpdateRate,
                );
            })
            .catch(() => {
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

    onUpdateRate = () => {
        const { amount, currencyRate } = this.state;

        if (amount && currencyRate) {
            const inRate = Number(amount) * currencyRate.rate;
            this.setState({
                amountRate: String(inRate),
            });
        }
    };

    onAccountChange = (item: AccountModel) => {
        this.setState({
            source: item,
        });
    };

    onAmountChange = (amount: string) => {
        const { currencyRate } = this.state;

        this.setState({
            amount,
        });

        if (!amount) {
            this.setState({
                amountRate: '',
            });

            return;
        }

        if (currencyRate) {
            const inRate = new BigNumber(amount).multipliedBy(currencyRate.rate).decimalPlaces(8).toFixed();
            this.setState({
                amountRate: String(inRate),
            });
        }
    };

    onRateAmountChange = (amount: string) => {
        const { currencyRate } = this.state;

        this.setState({
            amountRate: amount,
        });

        if (!amount) {
            this.setState({
                amount: '',
            });
            return;
        }

        if (currencyRate) {
            const inXRP = new BigNumber(amount).dividedBy(currencyRate.rate).decimalPlaces(6).toFixed();
            this.setState({
                amount: inXRP,
            });
        }
    };

    getLink = () => {
        const { source, amount, withAmount } = this.state;

        let content = `https://xumm.app/detect/request:${source.address}`;

        if (amount && withAmount) {
            content += `?amount=${amount}`;
        }

        return content;
    };

    toggleUseAmount = () => {
        const { withAmount } = this.state;

        this.setState({
            withAmount: !withAmount,
        });
    };

    onHeaderBackPress = () => {
        Keyboard.dismiss();
        setTimeout(() => {
            Navigator.pop();
        }, 10);
    };

    onHeaderSharePress = () => {
        Share.share({
            message: this.getLink(),
            url: undefined,
        }).catch(() => {});
    };

    calcKeyboardAwareExtraOffset = (input: any, inputHeight: number) => {
        if (input === this.amountInputRef?.current) {
            return inputHeight + Platform.select({ ios: 10, android: AppSizes.safeAreaBottomInset, default: 0 });
        }
        return 0;
    };

    renderAmountInput = () => {
        const { coreSettings, withAmount, amount, amountRate, currencyRate } = this.state;

        if (!withAmount) return null;

        return (
            <>
                <View style={styles.amountContainer}>
                    <View style={AppStyles.flex1}>
                        <AmountInput
                            ref={this.amountInputRef}
                            testID="amount-input"
                            value={amount}
                            valueType={AmountValueType.Native}
                            onChange={this.onAmountChange}
                            style={styles.amountInput}
                            placeholderTextColor={AppColors.grey}
                            returnKeyType="done"
                        />
                    </View>
                </View>

                <View style={styles.amountRateContainer}>
                    <View style={AppStyles.centerContent}>
                        <Text style={styles.amountRateInput}>~ </Text>
                    </View>
                    <View style={AppStyles.flex1}>
                        <AmountInput
                            ref={this.amountRateInputRef}
                            testID="amount-rate-input"
                            value={amountRate}
                            valueType={AmountValueType.IOU}
                            editable={!!currencyRate}
                            onChange={this.onRateAmountChange}
                            style={[styles.amountRateInput]}
                            placeholderTextColor={AppColors.grey}
                            returnKeyType="done"
                        />
                    </View>
                    <View style={styles.currencySymbolTextContainer}>
                        <Text style={styles.currencySymbolText}>{coreSettings.currency}</Text>
                    </View>
                </View>
            </>
        );
    };

    render() {
        const { accounts, source, withAmount } = this.state;

        return (
            <View testID="request-screen" style={styles.container}>
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: this.onHeaderBackPress,
                    }}
                    centerComponent={{ text: 'Request' }}
                    rightComponent={{
                        icon: 'IconShare',
                        iconSize: 23,
                        onPress: this.onHeaderSharePress,
                    }}
                />

                <KeyboardAwareScrollView
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    calculateExtraOffset={this.calcKeyboardAwareExtraOffset}
                >
                    <View style={styles.qrCodeContainer}>
                        <View style={styles.qrCode}>
                            <QRCode size={AppSizes.moderateScale(150)} value={this.getLink()} />
                        </View>
                    </View>

                    <HorizontalLine />

                    <View style={styles.rowItem}>
                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.to')}
                            </Text>
                        </View>
                        <View style={styles.accountPickerContainer}>
                            <AccountPicker onSelect={this.onAccountChange} accounts={accounts} selectedItem={source} />
                        </View>
                    </View>

                    {/* Amount */}
                    <View style={styles.rowItem}>
                        <TouchableDebounce
                            activeOpacity={0.8}
                            style={[AppStyles.row, styles.rowTitle]}
                            onPress={this.toggleUseAmount}
                        >
                            <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                    {Localize.t('global.requestWithAmount')}
                                </Text>
                            </View>
                            <View style={AppStyles.flex1}>
                                <CheckBox checked={withAmount} onPress={this.toggleUseAmount} />
                            </View>
                        </TouchableDebounce>

                        {this.renderAmountInput()}
                    </View>
                </KeyboardAwareScrollView>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default RequestView;
