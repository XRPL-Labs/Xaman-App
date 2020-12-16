/**
 * Send Summary Step
 */

import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import {
    Animated,
    View,
    Image,
    Text,
    KeyboardAvoidingView,
    Alert,
    ScrollView,
    Platform,
    LayoutChangeEvent,
} from 'react-native';

import { AccountSchema } from '@store/schemas/latest';

import { AppScreens } from '@common/constants';
import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Images } from '@common/helpers/images';

import Preferences from '@common/libs/preferences';
import { NormalizeCurrencyCode } from '@common/libs/utils';

// components
import { AmountInput, Button, AccordionPicker, Footer, Spacer, TextInput, Header } from '@components/General';

// locale
import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

import { StepsContext } from '../../Context';

/* Component ==================================================================== */
class SummaryStep extends Component {
    gradientHeight: Animated.Value;
    amountInput: AmountInput;
    destinationTagInput: TextInput;

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

    onDescriptionChange = (text: string) => {
        const { payment } = this.context;

        if (text) {
            payment.Memos = [
                {
                    data: text,
                    format: 'text/plain',
                    type: 'Description',
                },
            ];
        } else {
            payment.Memos = [];
        }
    };

    onDestinationTagChange = (text: string) => {
        const { setDestination, destination } = this.context;
        const destinationTag = text.replace(/[^0-9]/g, '');

        if (Number(destinationTag) < 2 ** 32) {
            Object.assign(destination, { tag: destinationTag });
        }

        setDestination(destination);
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

    onAccountChange = (item: AccountSchema) => {
        const { currency, setSource } = this.context;

        if (typeof currency === 'string') {
            setSource(item);
        } else if (item.hasCurrency(currency.currency)) {
            setSource(item);
        } else {
            Alert.alert(Localize.t('global.error'), Localize.t('send.selectedAccountDoNotSupportAsset'));
        }
    };

    onAmountChange = (amount: string) => {
        const { setAmount } = this.context;
        // set amount
        setAmount(amount);
    };

    showMemoAlert = async () => {
        const { payment } = this.context;

        const displayedMemoAlert = await Preferences.get(Preferences.keys.DISPLAYED_MEMO_ALERT);

        if (!displayedMemoAlert && payment.Memos) {
            Prompt(
                Localize.t('global.pleaseNote'),
                Localize.t('send.memoPublicWarning'),
                [
                    {
                        text: Localize.t('global.doNotRemindMe'),
                        onPress: () => {
                            Preferences.set(Preferences.keys.DISPLAYED_MEMO_ALERT, 'YES');
                        },
                        style: 'destructive',
                    },
                    { text: Localize.t('global.dismiss') },
                ],
                { type: 'default' },
            );
        }
    };

    showEnterDestinationTag = () => {
        const { setDestination, destination } = this.context;

        Navigator.showOverlay(
            AppScreens.Overlay.EnterDestinationTag,
            {
                layout: {
                    backgroundColor: 'transparent',
                    componentBackgroundColor: 'transparent',
                },
            },
            {
                buttonType: 'apply',
                destination,
                onFinish: (destinationTag: string) => {
                    Object.assign(destination, { tag: destinationTag });
                    setDestination(destination);
                },
                onScannerRead: ({ tag }: { tag: number }) => {
                    Object.assign(destination, { tag: String(tag) });
                    setDestination(destination);

                    this.showEnterDestinationTag();
                },

                onScannerClose: this.showEnterDestinationTag,
            },
        );
    };

    renderAccountItem = (account: AccountSchema, selected: boolean) => {
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
    };

    renderCurrencyItem = (item: any) => {
        const { source } = this.context;

        // XRP
        if (typeof item === 'string') {
            return (
                <View style={[styles.pickerItem]}>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <View style={[styles.xrpAvatarContainer]}>
                            <Image style={[styles.xrpAvatar]} source={Images.IconXrp} />
                        </View>
                        <View style={[AppStyles.column, AppStyles.centerContent]}>
                            <Text style={[styles.currencyItemLabel]}>XRP</Text>
                            <Text style={[styles.currencyBalance]}>
                                {Localize.t('global.available')}: {Localize.formatNumber(source.availableBalance)}
                            </Text>
                        </View>
                    </View>
                </View>
            );
        }

        return (
            <View style={[styles.pickerItem]}>
                <View style={[AppStyles.row, AppStyles.centerAligned]}>
                    <View style={[styles.brandAvatarContainer]}>
                        <Image style={[styles.brandAvatar]} source={{ uri: item.counterParty.avatar }} />
                    </View>
                    <View style={[AppStyles.column, AppStyles.centerContent]}>
                        <Text style={[styles.currencyItemLabel]}>
                            {NormalizeCurrencyCode(item.currency.currency)}

                            {item.currency.name && <Text style={[AppStyles.subtext]}> - {item.currency.name}</Text>}
                        </Text>
                        <Text style={[styles.currencyBalance]}>
                            {Localize.t('global.balance')}: {Localize.formatNumber(item.balance)}
                        </Text>
                    </View>
                </View>
            </View>
        );
    };

    getCurrencyName = (): string => {
        const { currency } = this.context;

        // XRP
        if (typeof currency === 'string') {
            return 'XRP';
        }

        return NormalizeCurrencyCode(currency.currency.currency);
    };

    goNext = () => {
        const { goNext, currency, source, amount, destination, destinationInfo, setAmount } = this.context;

        const bAmount = new BigNumber(amount);

        if (source.balance === 0) {
            Alert.alert(Localize.t('global.error'), Localize.t('account.accountIsNotActivated'));
            return;
        }

        // if IOU and obligation can send unlimited
        if (typeof currency !== 'string' && currency.obligation) {
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

        // check if destination requires the destination tag
        if (destinationInfo.requireDestinationTag && (!destination.tag || Number(destination.tag) === 0)) {
            Alert.alert(Localize.t('global.warning'), Localize.t('send.destinationTagIsRequired'));
            return;
        }

        // go to next screen
        goNext();
    };

    goBack = () => {
        const { goBack, setDestination } = this.context;

        // clear destination
        setDestination(undefined);

        goBack();
    };

    render() {
        const { source, accounts, amount, destination, currency, isLoading } = this.context;

        return (
            <View testID="send-summary-view" style={[styles.container]}>
                <KeyboardAvoidingView
                    enabled={Platform.OS === 'ios'}
                    keyboardVerticalOffset={Header.Height}
                    behavior="padding"
                    style={[AppStyles.flex1, AppStyles.stretchSelf]}
                >
                    <ScrollView style={[AppStyles.flex1]}>
                        <View onLayout={this.setGradientHeight} style={[styles.rowItem, styles.rowItemGrey]}>
                            <Animated.Image
                                source={Images.SideGradient}
                                style={[styles.gradientImage, { height: this.gradientHeight }]}
                                resizeMode="stretch"
                            />
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.greyDark }]}>
                                    {Localize.t('global.from')}
                                </Text>
                            </View>
                            <AccordionPicker
                                onSelect={this.onAccountChange}
                                items={accounts}
                                renderItem={this.renderAccountItem}
                                selectedItem={source}
                                keyExtractor={(i) => i.address}
                                containerStyle={{ backgroundColor: AppColors.transparent }}
                            />
                            <Spacer size={20} />

                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.greyDark }]}>
                                    {Localize.t('global.to')}
                                </Text>
                            </View>
                            <Spacer size={15} />

                            <View style={[styles.rowTitle]}>
                                <View style={[styles.pickerItem]}>
                                    <Text style={[styles.pickerItemTitle]}>{destination.name}</Text>
                                    <Text
                                        style={[styles.pickerItemSub, AppStyles.colorGreyDark]}
                                        adjustsFontSizeToFit
                                        numberOfLines={1}
                                    >
                                        {destination.address}
                                    </Text>
                                </View>
                            </View>

                            <Spacer size={20} />

                            <View style={AppStyles.row}>
                                <View style={AppStyles.flex1}>
                                    <View style={[styles.rowTitle]}>
                                        <Text style={[AppStyles.monoSubText, AppStyles.colorGreyDark]}>
                                            {destination.tag && `${Localize.t('global.destinationTag')}: `}
                                            <Text style={AppStyles.colorBlue}>
                                                {destination.tag || Localize.t('send.noDestinationTag')}
                                            </Text>
                                        </Text>
                                    </View>
                                </View>
                                <Button
                                    onPress={this.showEnterDestinationTag}
                                    style={styles.editButton}
                                    roundedSmall
                                    iconSize={13}
                                    light
                                    icon="IconEdit"
                                />
                            </View>
                        </View>

                        {/* Currency */}
                        <View style={[styles.rowItem]}>
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.greyDark }]}>
                                    {Localize.t('global.asset')}
                                </Text>
                            </View>
                            <Spacer size={15} />

                            <View style={[styles.rowTitle]}>{this.renderCurrencyItem(currency)}</View>
                        </View>

                        {/* Amount */}
                        <View style={[styles.rowItem]}>
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.greyDark }]}>
                                    {Localize.t('global.amount')}
                                </Text>
                            </View>
                            <Spacer size={15} />

                            <View style={AppStyles.row}>
                                <View style={AppStyles.flex1}>
                                    <AmountInput
                                        ref={(r) => {
                                            this.amountInput = r;
                                        }}
                                        onChange={this.onAmountChange}
                                        style={[styles.amountInput]}
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

                        {/* Memo */}
                        <View style={[styles.rowItem]}>
                            <View style={[styles.rowTitle]}>
                                <Text style={[AppStyles.subtext, AppStyles.strong, { color: AppColors.greyDark }]}>
                                    {Localize.t('global.memo')}
                                </Text>
                            </View>
                            <Spacer size={15} />
                            <TextInput
                                onBlur={this.showMemoAlert}
                                onChangeText={this.onDescriptionChange}
                                placeholder={Localize.t('send.enterPublicMemo')}
                                inputStyle={styles.inputStyle}
                                maxLength={300}
                                returnKeyType="done"
                                autoCapitalize="sentences"
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
                {/* Bottom Bar */}
                <Footer style={[AppStyles.row]} safeArea>
                    <View style={[AppStyles.flex1, AppStyles.paddingRightSml]}>
                        <Button secondary label={Localize.t('global.back')} onPress={this.goBack} />
                    </View>
                    <View style={[AppStyles.flex2]}>
                        <Button
                            textStyle={AppStyles.strong}
                            label={Localize.t('global.send')}
                            onPress={this.goNext}
                            isLoading={isLoading}
                        />
                    </View>
                </Footer>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default SummaryStep;
