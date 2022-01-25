/* eslint-disable react-native/no-inline-styles */

/**
 * Send Payment Details/Step
 */

import { filter } from 'lodash';
import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { View, Text, Alert, InteractionManager, Platform } from 'react-native';

import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { BackendService } from '@services';

import { Images } from '@common/helpers/images';
import { Prompt, Toast } from '@common/helpers/interface';

import { NormalizeCurrencyCode, XRPLValueToNFT } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';

// components
import { Avatar, Button, KeyboardAwareScrollView, AmountInput, AmountText, Footer } from '@components/General';
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

    getAvailableBalance = () => {
        const { currency, source, sendingNFT } = this.context;

        let availableBalance;

        // XRP
        if (typeof currency === 'string') {
            availableBalance = CalculateAvailableBalance(source);
        } else if (sendingNFT) {
            availableBalance = XRPLValueToNFT(currency.balance);
        } else {
            availableBalance = currency.balance;
        }

        return availableBalance;
    };

    goNext = () => {
        const { goNext, currency, source, amount, setAmount } = this.context;

        const bAmount = new BigNumber(amount);

        // check if account is activated
        if (source.balance === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountIsNotActivated'));
            return;
        }

        const isXRP = typeof currency === 'string';

        // check for exceed amount
        // if IOU and obligation can send unlimited
        if (typeof currency !== 'string' && currency.obligation) {
            // last set amount parsed by bignumber
            setAmount(bAmount.toString(10));
            // go to next screen
            goNext();
            return;
        }

        // @ts-ignore
        const availableBalance = new BigNumber(this.getAvailableBalance());

        // check if amount is bigger than what user can spend
        if (bAmount.isGreaterThan(availableBalance)) {
            Prompt(
                Localize.t('global.error'),
                Localize.t('send.theMaxAmountYouCanSendIs', {
                    spendable: Localize.formatNumber(availableBalance.toNumber()),
                    currency: this.getCurrencyName(),
                }),
                [
                    { text: Localize.t('global.cancel') },
                    {
                        text: isXRP ? Localize.t('global.update') : Localize.t('global.next'),
                        onPress: () => {
                            if (isXRP) {
                                this.onAmountChange(availableBalance.toString());
                            } else {
                                setAmount(availableBalance.toString());
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

        // last set amount parsed by bignumber
        setAmount(bAmount.toString());

        // go to next screen
        goNext();
    };

    getCurrencyName = (): string => {
        const { currency } = this.context;

        // XRP
        if (typeof currency === 'string') {
            return 'XRP';
        }

        return NormalizeCurrencyCode(currency.currency.currency);
    };

    applyAllBalance = () => {
        // @ts-ignore
        const availableBalance = new BigNumber(this.getAvailableBalance());

        if (availableBalance.isLessThan(0.00000001)) {
            return;
        }

        this.onAmountChange(availableBalance.toString());
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
        const { setAmount } = this.context;

        setAmount(amount);

        if (!amount) {
            this.setState({
                amountRate: '',
            });

            return;
        }

        if (currencyRate) {
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
            const inXRP = new BigNumber(amount).dividedBy(currencyRate.lastRate).decimalPlaces(6).toFixed();
            setAmount(String(inXRP));
        }
    };

    onAccountChange = (item: AccountSchema) => {
        const { setSource, setCurrency } = this.context;

        // restore currency to default XRP
        setCurrency('XRP');

        // set new source
        setSource(item);
    };

    onCurrencyChange = (item: string | TrustLineSchema) => {
        const { setCurrency, setAmount } = this.context;

        // xrp
        if (typeof item === 'string') {
            setCurrency('XRP');
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
            return inputHeight + Platform.select({ ios: 10, android: AppSizes.bottomStableInset });
        }
        return 0;
    };

    renderCurrencyItem = (item: any, selected: boolean) => {
        const { source } = this.context;
        // XRP
        if (typeof item === 'string') {
            return (
                <View>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[styles.currencyImageContainer]}>
                            <Avatar border size={35} source={Images.IconXrpNew} />
                        </View>
                        <View style={[AppStyles.column, AppStyles.centerContent]}>
                            <Text style={[styles.currencyItemLabel, selected && styles.currencyItemLabelSelected]}>
                                XRP
                            </Text>
                            <Text
                                style={[styles.currencyBalance, selected ? AppStyles.colorBlue : AppStyles.colorGrey]}
                            >
                                {Localize.t('global.available')}:{' '}
                                {Localize.formatNumber(CalculateAvailableBalance(source))}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View>
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[styles.currencyImageContainer]}>
                        <Avatar border size={35} source={{ uri: item.counterParty.avatar }} />
                    </View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <Text style={[styles.currencyItemLabel, selected && styles.currencyItemLabelSelected]}>
                            {NormalizeCurrencyCode(item.currency.currency)}
                            {item.currency.name && (
                                <Text style={[AppStyles.subtext, selected && styles.currencyItemLabelSelected]}>
                                    {' '}
                                    - {item.currency.name}
                                </Text>
                            )}
                        </Text>

                        <AmountText
                            prefix={`${Localize.t('global.balance')}: `}
                            style={[styles.currencyBalance, selected ? AppStyles.colorBlue : AppStyles.colorGrey]}
                            value={item.balance}
                        />
                    </View>
                </View>
            </View>
        );
    };

    render() {
        const { amountRate, currencyRate } = this.state;
        const { goBack, accounts, source, currency, amount, sendingNFT, coreSettings } = this.context;

        return (
            <View testID="send-details-view" style={[styles.container]}>
                <KeyboardAwareScrollView
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    calculateExtraOffset={this.calcKeyboardAwareExtraOffset}
                >
                    {/* Source Account */}
                    <View style={[styles.rowItem]}>
                        <View style={[styles.rowTitle]}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.from')}
                            </Text>
                        </View>
                        <AccountPicker onSelect={this.onAccountChange} accounts={accounts} selectedItem={source} />
                    </View>
                    {/* Currency */}
                    <View style={[styles.rowItem]}>
                        <View style={[styles.rowTitle]}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.asset')}
                            </Text>
                        </View>
                        <CurrencyPicker
                            account={source}
                            onSelect={this.onCurrencyChange}
                            currencies={
                                source
                                    ? ['XRP', ...filter(source.lines, (l) => l.balance > 0 || l.obligation === true)]
                                    : []
                            }
                            selectedItem={currency}
                        />
                    </View>

                    {/* Amount */}
                    <View style={[styles.rowItem]}>
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
                                    onPress={this.applyAllBalance}
                                    label={Localize.t('global.all')}
                                    icon="IconArrowDown"
                                    iconSize={10}
                                />
                            </View>
                        </View>
                        <View style={[styles.amountContainer]}>
                            <View style={AppStyles.flex1}>
                                <AmountInput
                                    ref={this.amountInput}
                                    testID="amount-input"
                                    value={amount}
                                    valueType={typeof currency === 'string' ? AmountValueType.XRP : AmountValueType.IOU}
                                    fractional={!sendingNFT}
                                    onChange={this.onAmountChange}
                                    style={[styles.amountInput]}
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
                        {/* only show rate for XRP payments */}
                        {typeof currency === 'string' && (
                            <View style={[styles.amountRateContainer]}>
                                <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                                    <Text style={[styles.amountRateInput]}>~ </Text>
                                </View>
                                <View style={AppStyles.flex1}>
                                    <AmountInput
                                        ref={this.amountRateInput}
                                        testID="amount-rate-input"
                                        value={amountRate}
                                        valueType={AmountValueType.IOU}
                                        onChange={this.onRateAmountChange}
                                        editable={!!currencyRate}
                                        style={[styles.amountRateInput]}
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
                <Footer style={[AppStyles.row]} safeArea>
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            light
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={goBack}
                        />
                    </View>
                    <View style={[AppStyles.flex2]}>
                        <Button
                            testID="next-button"
                            textStyle={AppStyles.strong}
                            isDisabled={!amount || parseFloat(amount) === 0}
                            label={Localize.t('global.next')}
                            icon="IconChevronRight"
                            iconPosition="right"
                            iconStyle={AppStyles.imgColorWhite}
                            onPress={this.goNext}
                        />
                    </View>
                </Footer>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default DetailsStep;
