/* eslint-disable react-native/no-inline-styles */

/**
 * Send Payment Details/Step
 */

import { filter } from 'lodash';
import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager, Platform } from 'react-native';

import LedgerService from '@services/LedgerService';
import BackendService from '@services/BackendService';
import NetworkService from '@services/NetworkService';

import { AccountModel, TrustLineModel } from '@store/models';

import { Prompt, Toast } from '@common/helpers/interface';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';

// components
import { Button, KeyboardAwareScrollView, AmountInput, Footer } from '@components/General';
import { AmountValueType } from '@components/General/AmountInput';
import { AccountPicker, CurrencyPicker } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles, AppColors, AppSizes } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';
/* Types  ==================================================================== */
interface Props {}

interface State {
    isLoadingAvailableBalance: boolean;
    isCheckingBalance: boolean;
    currencyRate: any;
    amountRate: string;
}

/* Component ==================================================================== */
class DetailsStep extends Component<Props, State> {
    amountInput: React.RefObject<typeof AmountInput | null>;
    amountRateInput: React.RefObject<typeof AmountInput | null>;

    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: undefined) {
        super(props);

        this.state = {
            isLoadingAvailableBalance: false,
            isCheckingBalance: false,
            currencyRate: undefined,
            amountRate: '',
        };

        this.amountInput = React.createRef();
        this.amountRateInput = React.createRef();
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchCurrencyRate);
    }

    fetchCurrencyRate = () => {
        const { coreSettings } = this.context;

        const { currency } = coreSettings;

        BackendService.getCurrencyRate(currency)
            .then((rate) => {
                this.setState(
                    {
                        currencyRate: rate,
                    },
                    this.onUpdateRate,
                );
            })
            .catch(() => {
                Toast(Localize.t('global.unableToFetchCurrencyRate'));
            });
    };

    getAvailableBalance = (): Promise<number | string> => {
        const { source, currency } = this.context;

        return new Promise((resolve) => {
            if (typeof currency === 'string') {
                // native currency
                resolve(CalculateAvailableBalance(source));
            } else {
                // IOU
                // we fetch the IOU directly from Ledger
                LedgerService.getFilteredAccountLine(source.address, {
                    issuer: currency.currency.issuer,
                    currency: currency.currency.currency,
                })
                    .then((line) => {
                        resolve(line.balance);
                    })
                    .catch(() => {
                        // in case of error just return IOU cached balance
                        resolve(currency.balance);
                    });
            }
        });
    };

    goNext = async () => {
        const { goNext, currency, source, amount, setAmount } = this.context;

        // check if account is activated
        // if not just show an alert an return
        if (source.balance === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountIsNotActivated'));
            return;
        }

        // check for exceed amount
        // if sending IOU and obligation can send unlimited
        if (typeof currency !== 'string' && currency.obligation) {
            // go to next screen
            goNext();
            return;
        }

        this.setState({
            isCheckingBalance: true,
        });

        const availableBalance = await this.getAvailableBalance();

        this.setState({
            isCheckingBalance: false,
        });

        // check if amount is bigger than what user can spend
        // show an alert and let user be able to set max amount
        if (new BigNumber(amount).isGreaterThan(availableBalance)) {
            Prompt(
                Localize.t('global.error'),
                Localize.t('send.theMaxAmountYouCanSendIs', {
                    spendable: Localize.formatNumber(Number(availableBalance)),
                    currency: this.getCurrencyName(),
                }),
                [
                    { text: Localize.t('global.cancel') },
                    {
                        text: typeof currency === 'string' ? Localize.t('global.update') : Localize.t('global.next'),
                        onPress: () => {
                            if (typeof currency === 'string') {
                                this.onAmountChange(String(availableBalance));
                            } else {
                                setAmount(String(availableBalance));
                                // go to next screen
                                goNext();
                            }
                        },
                    },
                ],
                { type: 'default' },
            );
            return;
        }

        // go to next screen
        goNext();
    };

    getCurrencyName = (): string => {
        const { currency } = this.context;

        // native currency
        if (typeof currency === 'string') {
            return NetworkService.getNativeAsset();
        }

        return NormalizeCurrencyCode(currency.currency.currency);
    };

    applyAllBalance = async () => {
        this.setState({
            isLoadingAvailableBalance: true,
        });

        const availableBalance = await this.getAvailableBalance();

        this.setState({
            isLoadingAvailableBalance: false,
        });

        if (new BigNumber(availableBalance).isLessThan(0.00000001)) {
            return;
        }

        this.onAmountChange(String(availableBalance));
    };

    onUpdateRate = () => {
        const { currencyRate } = this.state;
        const { amount } = this.context;

        if (amount && currencyRate) {
            const inRate = new BigNumber(amount).multipliedBy(currencyRate.lastRate).decimalPlaces(8).toFixed();
            this.setState({
                amountRate: inRate,
            });
        }
    };

    onAmountChange = (amount: string) => {
        const { currencyRate } = this.state;
        const { currency, setAmount } = this.context;

        setAmount(amount);

        if (!amount) {
            this.setState({
                amountRate: '',
            });

            return;
        }

        if (typeof currency === 'string' && currencyRate) {
            const inRate = new BigNumber(amount).multipliedBy(currencyRate.lastRate).decimalPlaces(8).toFixed();
            this.setState({
                amountRate: inRate,
            });
        }
    };

    onRateAmountChange = (amount: string) => {
        const { setAmount } = this.context;
        const { currencyRate } = this.state;

        this.setState({
            amountRate: amount,
        });

        if (!amount) {
            setAmount('');
            return;
        }

        if (currencyRate) {
            const inNativeCurrency = new BigNumber(amount).dividedBy(currencyRate.lastRate).decimalPlaces(6).toFixed();
            setAmount(String(inNativeCurrency));
        }
    };

    onAccountChange = (item: AccountModel) => {
        const { setSource, setCurrency } = this.context;

        // restore currency to default native currency
        setCurrency(NetworkService.getNativeAsset());

        // set new source
        setSource(item);
    };

    onCurrencyChange = (item: string | TrustLineModel) => {
        const { setCurrency, setAmount } = this.context;

        // native currency
        if (typeof item === 'string') {
            setCurrency(NetworkService.getNativeAsset());
        } else {
            setCurrency(item);
        }

        // clear amount and rate
        setAmount('');

        this.setState({
            amountRate: '',
        });
    };

    calcKeyboardAwareExtraOffset = (input: any, inputHeight: number) => {
        const { currency } = this.context;

        if (input === this.amountInput.current && typeof currency === 'string') {
            return inputHeight + Platform.select({ ios: 10, android: AppSizes.safeAreaBottomInset });
        }
        return 0;
    };

    render() {
        const { amountRate, currencyRate, isLoadingAvailableBalance, isCheckingBalance } = this.state;
        const { goBack, accounts, source, currency, amount, coreSettings } = this.context;

        return (
            <View testID="send-details-view" style={styles.container}>
                <KeyboardAwareScrollView
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    calculateExtraOffset={this.calcKeyboardAwareExtraOffset}
                >
                    {/* Source Account */}
                    <View style={styles.rowItem}>
                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.from')}
                            </Text>
                        </View>
                        <AccountPicker onSelect={this.onAccountChange} accounts={accounts} selectedItem={source} />
                    </View>
                    {/* Currency */}
                    <View style={styles.rowItem}>
                        <View style={styles.rowTitle}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.asset')}
                            </Text>
                        </View>
                        <CurrencyPicker
                            account={source}
                            onSelect={this.onCurrencyChange}
                            currencies={
                                source
                                    ? [
                                          NetworkService.getNativeAsset(),
                                          ...filter(
                                              source.lines.sorted([['order', false]]),
                                              (l) => l.balance > 0 || l.obligation === true,
                                          ),
                                      ]
                                    : []
                            }
                            selectedItem={currency}
                        />
                    </View>

                    {/* Amount */}
                    <View style={styles.rowItem}>
                        <View style={[styles.rowTitle, { paddingBottom: 0 }]}>
                            <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                    {Localize.t('global.amount')}
                                </Text>
                            </View>

                            <View>
                                <Button
                                    light
                                    roundedSmall
                                    isLoading={isLoadingAvailableBalance}
                                    onPress={this.applyAllBalance}
                                    label={Localize.t('global.all')}
                                    icon="IconArrowDown"
                                    iconSize={10}
                                />
                            </View>
                        </View>
                        <View style={styles.amountContainer}>
                            <View style={AppStyles.flex1}>
                                <AmountInput
                                    ref={this.amountInput}
                                    testID="amount-input"
                                    value={amount}
                                    valueType={
                                        typeof currency === 'string' ? AmountValueType.Native : AmountValueType.IOU
                                    }
                                    fractional
                                    onChange={this.onAmountChange}
                                    style={styles.amountInput}
                                    placeholderTextColor={AppColors.grey}
                                    returnKeyType="done"
                                />
                            </View>
                            <Button
                                onPress={() => {
                                    this.amountInput.current.focus();
                                }}
                                style={styles.editButton}
                                roundedSmall
                                iconSize={15}
                                iconStyle={AppStyles.imgColorGreyDark}
                                light
                                icon="IconEdit"
                            />
                        </View>
                        {/* only show rate for native currency payments */}
                        {typeof currency === 'string' && (
                            <View style={styles.amountRateContainer}>
                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={styles.amountRateInput}>~ </Text>
                                </View>
                                <View style={AppStyles.flex1}>
                                    <AmountInput
                                        ref={this.amountRateInput}
                                        testID="amount-rate-input"
                                        value={amountRate}
                                        valueType={AmountValueType.IOU}
                                        onChange={this.onRateAmountChange}
                                        editable={!!currencyRate}
                                        style={styles.amountRateInput}
                                        placeholderTextColor={AppColors.grey}
                                        returnKeyType="done"
                                    />
                                </View>
                                <View style={styles.currencySymbolTextContainer}>
                                    <Text style={[styles.currencySymbolText]}>{coreSettings.currency}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </KeyboardAwareScrollView>

                {/* Bottom Bar */}
                <Footer style={AppStyles.row} safeArea>
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={AppStyles.flex2}>
                        <Button
                            testID="next-button"
                            textStyle={AppStyles.strong}
                            isDisabled={!amount || parseFloat(amount) === 0}
                            label={Localize.t('global.next')}
                            icon="IconChevronRight"
                            iconPosition="right"
                            iconStyle={AppStyles.imgColorWhite}
                            onPress={this.goNext}
                            isLoading={isCheckingBalance}
                        />
                    </View>
                </Footer>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default DetailsStep;
