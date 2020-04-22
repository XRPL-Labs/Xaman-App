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
    TextInput,
    Alert,
    Platform,
    KeyboardAvoidingView,
    LayoutChangeEvent,
} from 'react-native';

import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import { Images } from '@common/helpers/images';
import { NormalizeAmount, NormalizeCurrencyCode } from '@common/libs/utils';

// components
import { Button, AccordionPicker, Footer } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* Component ==================================================================== */
class DetailsStep extends Component {
    gradientHeight: Animated.Value;
    amountInput: TextInput;

    static contextType = StepsContext;
    context: React.ContextType<typeof StepsContext>;

    constructor(props: undefined) {
        super(props);

        this.gradientHeight = new Animated.Value(0);
    }

    setGradientHeight = (event: LayoutChangeEvent) => {
        const { height } = event.nativeEvent.layout;

        if (height === 0) return;

        Animated.timing(this.gradientHeight, { toValue: height, useNativeDriver: false }).start();
    };

    goNext = () => {
        const { goNext, currency, source, amount, setAmount } = this.context;

        const bAmount = new BigNumber(amount);

        if (source.balance === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountIsNotActivated'));
            return;
        }

        const availableBalance = this.getAvailableBalance();

        // check if amount is bigger than what user can spend
        if (bAmount.toNumber() > availableBalance) {
            Alert.alert(
                Localize.t('global.error'),
                Localize.t('send.amountIsBiggerThanYourSpend', { spendable: availableBalance }),
            );
            return;
        }

        // check if balance can cover the transfer fee for non XRP currencies
        if (typeof currency !== 'string') {
            const rate = new BigNumber(currency.transfer_rate)
                .dividedBy(1000000)
                .minus(1000)
                .dividedBy(10);

            const fee = bAmount
                .multipliedBy(rate)
                .dividedBy(100)
                .decimalPlaces(6);
            const after = bAmount.plus(fee).toNumber();

            if (after > availableBalance) {
                Alert.alert(Localize.t('global.error'), Localize.t('send.balanceIsNotEnoughForFee', { fee }));
                return;
            }
        }

        // last set amount parsed by bignumber
        setAmount(bAmount.toString(10));

        // go to next screen
        goNext();
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
        const sendAmount = NormalizeAmount(amount);

        setAmount(sendAmount);
    };

    onAccountChange = (item: AccountSchema) => {
        const { setSource, setCurrency } = this.context;
        setCurrency('XRP');

        // set item
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

    renderAccountItem = (account: AccountSchema, selected: boolean) => {
        // console.log({ account });
        // if (account.default) {
        return (
            <View style={[styles.pickerItem]}>
                <Text style={[styles.pickerItemTitle, selected ? AppStyles.colorBlue : AppStyles.colorBlack]}>
                    {account.label}
                </Text>
                <Text
                    style={[styles.pickerItemSub, selected ? AppStyles.colorBlue : AppStyles.colorGreyDark]}
                    adjustsFontSizeToFit
                    numberOfLines={1}
                >
                    {account.address}
                </Text>
            </View>
        );
        // }
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
                                {Localize.t('global.balance')}: {source.availableBalance}
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
                            {Localize.t('global.balance')}: {item.balance}
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
                <KeyboardAvoidingView
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0}
                    behavior="padding"
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                >
                    <ScrollView style={[AppStyles.flex1]}>
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
                            <View style={[{ paddingLeft: 10 }]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                                    {Localize.t('global.from')}:
                                </Text>
                            </View>
                            <AccordionPicker
                                onSelect={this.onAccountChange}
                                items={accounts}
                                renderItem={this.renderAccountItem}
                                selectedItem={source}
                                keyExtractor={i => i.address}
                                containerStyle={{ backgroundColor: AppColors.transparent }}
                            />
                        </View>
                        {/* Currency */}
                        <View style={[styles.rowItem]}>
                            <View style={[{ paddingLeft: 10 }]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                                    {Localize.t('global.currency')}:
                                </Text>
                            </View>
                            <AccordionPicker
                                onSelect={this.onCurrencyChange}
                                items={['XRP', ...filter(source.lines, l => l.balance > 0)]}
                                renderItem={this.renderCurrencyItem}
                                selectedItem={currency}
                                keyExtractor={i => (typeof i === 'string' ? i : i.currency.id)}
                                containerStyle={{ backgroundColor: AppColors.transparent }}
                            />
                        </View>

                        {/* Amount */}
                        <View style={[styles.rowItem]}>
                            <View style={[{ paddingLeft: 10 }]}>
                                <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                                    {Localize.t('global.amount')}:
                                </Text>
                            </View>
                            <View style={[AppStyles.row]}>
                                <View style={AppStyles.flex1}>
                                    <TextInput
                                        ref={r => {
                                            this.amountInput = r;
                                        }}
                                        keyboardType="decimal-pad"
                                        autoCapitalize="words"
                                        onChangeText={this.onAmountChange}
                                        returnKeyType="done"
                                        placeholder="0"
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
                    </ScrollView>
                </KeyboardAvoidingView>

                {/* Bottom Bar */}
                <Footer style={[AppStyles.row]} safeArea>
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button
                            secondary
                            label={Localize.t('global.back')}
                            icon="IconChevronLeft"
                            onPress={() => {
                                goBack();
                            }}
                        />
                    </View>
                    <View style={[AppStyles.flex2]}>
                        <Button
                            textStyle={AppStyles.strong}
                            isDisabled={!amount || parseFloat(amount) === 0}
                            label={Localize.t('global.next')}
                            icon="IconChevronRight"
                            iconPosition="right"
                            iconStyle={AppStyles.imgColorWhite}
                            onPress={() => {
                                this.goNext();
                            }}
                        />
                    </View>
                </Footer>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default DetailsStep;
