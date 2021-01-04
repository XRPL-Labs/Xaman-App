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
} from 'react-native';

import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { Images } from '@common/helpers/images';
import { Prompt } from '@common/helpers/interface';

import { NormalizeCurrencyCode } from '@common/libs/utils';

// components
import { Header, Button, AccordionPicker, AmountInput, Footer } from '@components/General';
import { AccountPicker } from '@components/Modules';

import Localize from '@locale';

// style
import { AppStyles, AppColors, AppSizes } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* Component ==================================================================== */
class DetailsStep extends Component {
    gradientHeight: Animated.Value;
    amountInput: AmountInput;

    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: undefined) {
        super(props);

        this.gradientHeight = new Animated.Value(0);
    }

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
                            setAmount(availableBalance.toString());
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
        const { currency, source } = this.context;

        let availableBalance;

        // XRP
        if (typeof currency === 'string') {
            availableBalance = source.availableBalance;
        } else {
            availableBalance = currency.balance;
        }

        return availableBalance;
    };

    onAmountChange = (amount: string) => {
        const { setAmount } = this.context;

        setAmount(amount);
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
                        <Text
                            style={[styles.currencyBalance, selected ? AppStyles.colorBlue : AppStyles.colorGreyDark]}
                        >
                            {Localize.t('global.balance')}: {Localize.formatNumber(item.balance)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    render() {
        const { goBack } = this.context;
        const { accounts, source, currency, amount } = this.context;

        return (
            <View testID="send-details-view" style={[styles.container]}>
                <ScrollView style={[AppStyles.flex1, AppStyles.stretchSelf]}>
                    <KeyboardAvoidingView
                        enabled={Platform.OS === 'ios'}
                        keyboardVerticalOffset={Header.Height + AppSizes.extraKeyBoardPadding}
                        behavior="position"
                    >
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
                            <View style={[AppStyles.row]}>
                                <View style={AppStyles.flex1}>
                                    <AmountInput
                                        ref={(r) => {
                                            this.amountInput = r;
                                        }}
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
                                    iconSize={13}
                                    light
                                    icon="IconEdit"
                                />
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </ScrollView>

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
