/* eslint-disable react-native/no-inline-styles */

/**
 * Send Payment Details/Step
 */

import { filter } from 'lodash';
import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import {
    ScrollView,
    Animated,
    View,
    Image,
    Text,
    Alert,
    Platform,
    KeyboardAvoidingView,
    LayoutChangeEvent,
    InteractionManager,
} from 'react-native';

import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { BackendService } from '@services';

import { Images } from '@common/helpers/images';
import { Prompt, Toast } from '@common/helpers/interface';

import { NormalizeCurrencyCode, XRPLValueToNFT } from '@common/libs/utils';

// components
import { Header, Button, AccordionPicker, AmountInput, AmountText, Footer } from '@components/General';
import { AccountPicker } from '@components/Modules';

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
    gradientHeight: Animated.Value;
    amountInput: AmountInput;

    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: undefined) {
        super(props);

        this.state = {
            currencyRate: undefined,
            amountRate: '',
        };

        this.gradientHeight = new Animated.Value(0);
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

    setGradientHeight = (event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;

        if (height === 0) return;

        Animated.timing(this.gradientHeight, {
            toValue: height,
            useNativeDriver: false,
        }).start();
    };

    goNext = () => {
        const { goNext, currency, source, amount, setAmount } = this.context;

        const bAmount = new BigNumber(amount);

        // check if account is activated
        if (source.balance === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountIsNotActivated'));
            return;
        }

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
        const availableBalance = new BigNumber(this.getAvailableBalance()).toNumber();

        // check if amount is bigger than what user can spend
        if (bAmount.toNumber() > availableBalance) {
            Prompt(
                Localize.t('global.error'),
                Localize.t('send.theMaxAmountYouCanSendIs', {
                    spendable: Localize.formatNumber(availableBalance),
                    currency: this.getCurrencyName(),
                }),
                [
                    { text: Localize.t('global.cancel') },
                    {
                        text: Localize.t('global.update'),
                        onPress: () => {
                            this.onAmountChange(availableBalance.toString());
                        },
                    },
                ],
                { type: 'default' },
            );
            return;
        }

        // last set amount parsed by bignumber
        setAmount(bAmount.toString(10));

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

    getAvailableBalance = () => {
        const { currency, source, sendingNFT } = this.context;

        let availableBalance;

        // XRP
        if (typeof currency === 'string') {
            availableBalance = source.availableBalance;
        } else if (sendingNFT) {
            availableBalance = XRPLValueToNFT(currency.balance);
        } else {
            availableBalance = currency.balance;
        }

        return availableBalance;
    };

    onUpdateRate = () => {
        const { currencyRate } = this.state;
        const { amount } = this.context;

        if (amount && currencyRate) {
            const inRate = Number(amount) * currencyRate.lastRate;
            this.setState({
                amountRate: String(inRate),
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
            const inRate = Number(amount) * currencyRate.lastRate;
            this.setState({
                amountRate: String(inRate),
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
            const inXRP = Number(amount) / currencyRate.lastRate;
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

    onCurrencyChange = (item: TrustLineSchema) => {
        const { setCurrency } = this.context;

        // xrp
        if (typeof item === 'string') {
            setCurrency('XRP');
        } else {
            setCurrency(item);
        }
    };

    renderCurrencyItem = (item: any, selected: boolean) => {
        const { source } = this.context;
        // XRP
        if (typeof item === 'string') {
            return (
                <View style={[styles.pickerItemCurrency]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        {/* <View style={[styles.xrpAvatarContainer]}> */}
                        <View style={[styles.currencyImageContainer]}>
                            <Image style={[styles.currencyImageIcon]} source={Images.IconXrpNew} />
                        </View>
                        <View style={[AppStyles.column, AppStyles.centerContent]}>
                            <Text
                                style={[
                                    styles.currencyItemLabel,
                                    selected ? AppStyles.colorBlue : AppStyles.colorBlack,
                                ]}
                            >
                                XRP
                            </Text>
                            <Text
                                style={[
                                    styles.currencyBalance,
                                    selected ? AppStyles.colorBlue : AppStyles.colorGreyDark,
                                ]}
                            >
                                {Localize.t('global.available')}: {Localize.formatNumber(source.availableBalance)}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.pickerItemCurrency]}>
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[styles.currencyImageContainer]}>
                        <Image style={[styles.currencyImageIcon]} source={{ uri: item.counterParty.avatar }} />
                    </View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <Text style={[styles.currencyItemLabel, selected ? AppStyles.colorBlue : AppStyles.colorBlack]}>
                            {NormalizeCurrencyCode(item.currency.currency)}

                            {item.currency.name && <Text style={[AppStyles.subtext]}> - {item.currency.name}</Text>}
                        </Text>

                        <AmountText
                            prefix={`${Localize.t('global.balance')}: `}
                            style={[styles.currencyBalance, selected ? AppStyles.colorBlue : AppStyles.colorGreyDark]}
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
                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    behavior="padding"
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                    keyboardVerticalOffset={Header.Height + AppSizes.extraKeyBoardPadding}
                >
                    <ScrollView>
                        {/* Source Account */}
                        <View
                            onLayout={this.setGradientHeight}
                            style={[styles.rowItem, { backgroundColor: AppColors.light }]}
                        >
                            <Animated.Image
                                source={Images.SideGradient}
                                style={{
                                    width: 7,
                                    height: this.gradientHeight,
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                }}
                                resizeMode="stretch"
                            />
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                                    {Localize.t('global.from')}
                                </Text>
                            </View>
                            <AccountPicker onSelect={this.onAccountChange} accounts={accounts} selectedItem={source} />
                        </View>
                        {/* Currency */}
                        <View style={[styles.rowItem]}>
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                                    {Localize.t('global.asset')}
                                </Text>
                            </View>
                            <AccordionPicker
                                onSelect={this.onCurrencyChange}
                                items={
                                    source
                                        ? [
                                              'XRP',
                                              ...filter(source.lines, (l) => l.balance > 0 || l.obligation === true),
                                          ]
                                        : []
                                }
                                renderItem={this.renderCurrencyItem}
                                selectedItem={currency}
                                keyExtractor={(i) => (typeof i === 'string' ? i : i.currency.id)}
                                containerStyle={{ backgroundColor: AppColors.transparent }}
                            />
                        </View>

                        {/* Amount */}
                        <View style={[styles.rowItem]}>
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                                    {Localize.t('global.amount')}
                                </Text>
                            </View>
                            <View style={[styles.amountContainer]}>
                                <View style={AppStyles.flex1}>
                                    <AmountInput
                                        ref={(r) => {
                                            this.amountInput = r;
                                        }}
                                        fractional={!sendingNFT}
                                        testID="amount-input"
                                        onChange={this.onAmountChange}
                                        returnKeyType="done"
                                        style={[styles.amountInput]}
                                        placeholderTextColor={AppColors.greyDark}
                                        value={amount}
                                    />
                                </View>
                                <Button
                                    onPress={() => {
                                        this.amountInput.focus();
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
                                            editable={!!currencyRate}
                                            testID="amount-rate-input"
                                            onChange={this.onRateAmountChange}
                                            returnKeyType="done"
                                            style={[styles.amountRateInput]}
                                            placeholderTextColor={AppColors.greyDark}
                                            value={amountRate}
                                        />
                                    </View>
                                    <View style={styles.currencySymbolTextContainer}>
                                        <Text style={[styles.currencySymbolText]}>{coreSettings.currency}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Bar */}
                <Footer style={[AppStyles.row]} safeArea>
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button
                            testID="back-button"
                            secondary
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
