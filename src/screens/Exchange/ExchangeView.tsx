/**
 * Exchange currency Screen
 */
import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import {
    View,
    SafeAreaView,
    Text,
    Image,
    Alert,
    TextInput,
    Keyboard,
    TouchableOpacity,
    InteractionManager,
} from 'react-native';

import { Images } from '@common/helpers/images';
import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { TrustLineSchema, AccountSchema } from '@store/schemas/latest';
import { AccountRepository } from '@store/repositories';

import LedgerExchange from '@common/libs/ledger/exchange';
import { OfferCreate } from '@common/libs/ledger/transactions';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { NormalizeAmount, NormalizeCurrencyCode } from '@common/libs/utils';
// constants
import { AppScreens } from '@common/constants';

// components
import { Header, Spacer, Icon, Button, InfoMessage } from '@components';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    trustLine: TrustLineSchema;
}

export interface State {
    sourceAccount: AccountSchema;
    ledgerExchange: LedgerExchange;
    fromCurrency: string;
    paysAmount: string;
    exchangeRate: number;
    isExchanging: boolean;
    isVerifying: boolean;
}

/* Component ==================================================================== */
class ExchangeView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Exchange;

    paysAmountInput: TextInput;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        const XRPL_PAIR = { issuer: props.trustLine.currency.issuer, currency: props.trustLine.currency.currency };

        this.state = {
            sourceAccount: AccountRepository.getDefaultAccount(),
            ledgerExchange: new LedgerExchange(XRPL_PAIR),
            fromCurrency: 'XRP',
            paysAmount: '',
            exchangeRate: undefined,
            isExchanging: false,
            isVerifying: false,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.getExchangeRate();
        });
    }

    getExchangeRate = async () => {
        const { fromCurrency, ledgerExchange } = this.state;

        const direction = fromCurrency === 'XRP' ? 'sell' : 'buy';

        // sync from latest order book
        await ledgerExchange.sync();

        // get Liquidity grade
        const liquidityGrade = ledgerExchange.liquidityGrade(direction);

        if (liquidityGrade < 2) {
            if (liquidityGrade === 1) {
                Alert.alert(Localize.t('global.warning'), Localize.t('exchange.liquidityIsNotSoMuch'));
            }
            if (liquidityGrade === 0) {
                this.setState({
                    exchangeRate: 0,
                });
                return;
            }
        }

        this.setState({
            exchangeRate: ledgerExchange.getExchangeRate(direction),
        });
    };

    switchCurrency = () => {
        const { trustLine } = this.props;
        const { fromCurrency } = this.state;

        this.setState(
            {
                fromCurrency: fromCurrency === 'XRP' ? trustLine.currency.name : 'XRP',
            },
            () => {
                this.getExchangeRate();
            },
        );
    };

    createOffer = async (privateKey: string) => {
        const { trustLine } = this.props;
        const { sourceAccount, paysAmount, fromCurrency, exchangeRate } = this.state;

        this.setState({ isExchanging: true });

        const XRPL_PAIR = { issuer: trustLine.currency.issuer, currency: trustLine.currency.currency };

        const actualExchangeRate =
            fromCurrency === 'XRP'
                ? new BigNumber(exchangeRate).dividedBy(1.02)
                : new BigNumber(1).dividedBy(exchangeRate).dividedBy(1.02);

        const getsAmount = new BigNumber(paysAmount).multipliedBy(actualExchangeRate).decimalPlaces(6).toString(10);

        // create offer transaction
        const offer = new OfferCreate();

        if (fromCurrency === 'XRP') {
            offer.TakerGets = { currency: 'XRP', value: paysAmount };
            offer.TakerPays = { value: getsAmount, ...XRPL_PAIR };
        } else {
            offer.TakerGets = { value: paysAmount, ...XRPL_PAIR };
            offer.TakerPays = { currency: 'XRP', value: getsAmount };
        }

        // ImmediateOrCancel & Sell flag
        offer.Flags = [txFlags.OfferCreate.ImmediateOrCancel, txFlags.OfferCreate.Sell];

        // set source account
        offer.Account = { address: sourceAccount.address };

        // submit to the ledger
        const submitResult = await offer.submit(privateKey);

        if (!submitResult.success) {
            this.showResultAlert(
                Localize.t('global.error'),
                Localize.t('exchange.errorDuringExchange', { error: submitResult.message }),
            );
            this.setState({ isExchanging: false });
            return;
        }

        this.setState({ isVerifying: true });

        // transaction submitted successfully
        // verify
        const verifyResult = await offer.verify();

        this.setState({ isExchanging: false });

        if (verifyResult.success) {
            if (offer.Executed) {
                this.showResultAlert(
                    Localize.t('global.success'),
                    Localize.t('exchange.successfullyExchanged', {
                        payAmount: offer.TakerGot.value,
                        payCurrency: offer.TakerGot.currency,
                        getAmount: offer.TakerPaid.value,
                        getCurrency: offer.TakerPaid.currency,
                    }),
                );
            } else {
                this.showResultAlert(Localize.t('global.failed'), Localize.t('exchange.failedExchange'));
            }
        } else {
            this.showResultAlert(
                Localize.t('global.error'),
                Localize.t('exchange.errorDuringExchange', { error: submitResult.message }),
            );
        }
    };

    showResultAlert = (title: string, message: string) => {
        Prompt(
            title,
            message,
            [
                {
                    text: Localize.t('global.back'),

                    onPress: () => {
                        Navigator.pop();
                    },
                },
            ],
            { type: 'default' },
        );
    };

    exchange = () => {
        const { trustLine } = this.props;
        const { fromCurrency, exchangeRate, paysAmount } = this.state;

        // calculate gets amount
        const getsAmount = new BigNumber(paysAmount)
            .multipliedBy(fromCurrency === 'XRP' ? exchangeRate : 1 / exchangeRate)
            .decimalPlaces(3)
            .toString(10);

        // dismiss keyboard if present
        Keyboard.dismiss();

        // get available balance
        const availableBalance = this.getAvailableBalance();

        // check if user can spend this much
        if (parseFloat(paysAmount) > availableBalance) {
            Prompt(
                Localize.t('global.error'),
                Localize.t('exchange.theMaxAmountYouCanExchangeIs', {
                    spendable: availableBalance,
                    currency: fromCurrency === 'XRP' ? 'XRP' : NormalizeCurrencyCode(trustLine.currency.currency),
                }),
                [
                    { text: Localize.t('global.cancel') },
                    {
                        text: Localize.t('global.update'),
                        onPress: () => {
                            this.setState({
                                paysAmount: availableBalance.toString(),
                            });
                        },
                    },
                ],
                { type: 'default' },
            );
            return;
        }

        Prompt(
            Localize.t('global.pleaseNote'),
            Localize.t('exchange.doYouWantToExchange', {
                payAmount: paysAmount,
                payCurrency: fromCurrency,
                getAmount: getsAmount,
                getCurrency: fromCurrency === 'XRP' ? NormalizeCurrencyCode(trustLine.currency.currency) : 'XRP',
            }),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.doIt'),

                    onPress: () => {
                        Navigator.showOverlay(
                            AppScreens.Overlay.Vault,
                            {
                                overlay: {
                                    handleKeyboardEvents: true,
                                },
                                layout: {
                                    backgroundColor: 'transparent',
                                    componentBackgroundColor: 'transparent',
                                },
                            },
                            {
                                account: AccountRepository.getDefaultAccount(),
                                onOpen: (privateKey: string) => {
                                    this.createOffer(privateKey);
                                },
                            },
                        );
                    },
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    onPaysAmountChange = (amount: string) => {
        const paysAmount = NormalizeAmount(amount);

        this.setState({
            paysAmount,
        });
    };

    getAvailableBalance = () => {
        const { trustLine } = this.props;
        const { fromCurrency, sourceAccount } = this.state;

        let availableBalance;

        if (fromCurrency === 'XRP') {
            availableBalance = sourceAccount.availableBalance;
        } else {
            availableBalance = trustLine.balance;
        }

        return availableBalance;
    };

    render() {
        const { trustLine } = this.props;
        const { fromCurrency, exchangeRate, paysAmount, isExchanging, isVerifying } = this.state;

        let getsAmount = '0';

        if (exchangeRate) {
            getsAmount = new BigNumber(paysAmount || 0)
                .multipliedBy(fromCurrency === 'XRP' ? exchangeRate : 1 / exchangeRate)
                .decimalPlaces(3)
                .toString(10);
        }

        if (isExchanging) {
            return (
                <SafeAreaView style={[AppStyles.container, AppStyles.paddingSml, { backgroundColor: AppColors.light }]}>
                    <View style={[AppStyles.flex5, AppStyles.centerContent]}>
                        <Image style={styles.backgroundImageStyle} source={Images.IconRepeat} />
                    </View>

                    <View style={[AppStyles.flex4]}>
                        <View style={[AppStyles.flex1, AppStyles.centerContent, AppStyles.centerAligned]}>
                            {!isVerifying ? (
                                <Text style={[AppStyles.h4, AppStyles.textCenterAligned]}>
                                    {!isVerifying ? Localize.t('send.sending') : Localize.t('send.verifying')}
                                </Text>
                            ) : (
                                <Text style={[AppStyles.h5, AppStyles.textCenterAligned, AppStyles.colorGreen]}>
                                    {Localize.t('send.sent')}{' '}
                                    <Icon name="IconCheck" size={20} style={AppStyles.imgColorGreen} />
                                </Text>
                            )}

                            <Spacer size={10} />
                            {isVerifying && (
                                <Text style={[AppStyles.h4, AppStyles.textCenterAligned]}>
                                    {Localize.t('send.verifying')}
                                </Text>
                            )}
                        </View>
                        <View style={[AppStyles.flex2]}>
                            <Image style={styles.loaderStyle} source={require('@common/assets/loader.gif')} />
                            <Spacer size={20} />
                            <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                                {Localize.t('send.submittingToLedger')}
                            </Text>
                            <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                                {Localize.t('global.thisMayTakeFewSeconds')}
                            </Text>
                        </View>
                    </View>
                </SafeAreaView>
            );
        }

        return (
            <View
                onResponderRelease={() => Keyboard.dismiss()}
                onStartShouldSetResponder={() => true}
                testID="exchange-currency-view"
                style={[styles.container]}
            >
                <Header
                    leftComponent={{
                        icon: 'IconChevronLeft',
                        onPress: () => {
                            Navigator.pop();
                        },
                    }}
                    centerComponent={{
                        text: Localize.t('global.exchange'),
                    }}
                />
                <View style={[styles.contentContainer]}>
                    {/* From part */}
                    <View style={styles.fromContainer}>
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => {
                                if (this.paysAmountInput) {
                                    this.paysAmountInput.focus();
                                }
                            }}
                            style={[AppStyles.row]}
                        >
                            <View style={[AppStyles.row, AppStyles.flex1]}>
                                {fromCurrency === 'XRP' ? (
                                    <View style={[styles.xrpAvatarContainer]}>
                                        <Image source={Images.IconXrpNew} style={[styles.xrpAvatar]} />
                                    </View>
                                ) : (
                                    <View style={[styles.brandAvatarContainer]}>
                                        <Image
                                            style={[styles.brandAvatar]}
                                            source={{ uri: trustLine.counterParty.avatar }}
                                        />
                                    </View>
                                )}
                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text style={[styles.currencyLabel]}>
                                        {fromCurrency === 'XRP'
                                            ? 'XRP'
                                            : trustLine.currency.name ||
                                              NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                </View>
                            </View>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <Text style={styles.fromAmount}>-</Text>
                                <TextInput
                                    ref={(r) => {
                                        this.paysAmountInput = r;
                                    }}
                                    autoFocus={false}
                                    onChangeText={this.onPaysAmountChange}
                                    placeholder="0"
                                    placeholderTextColor={AppColors.red}
                                    keyboardType="decimal-pad"
                                    autoCapitalize="words"
                                    style={styles.fromAmount}
                                    value={paysAmount}
                                    returnKeyType="done"
                                />
                            </View>
                        </TouchableOpacity>
                        <Spacer />
                        <View>
                            <Text style={[styles.subLabel]}>
                                {Localize.t('global.spendable')}: {this.getAvailableBalance()}
                            </Text>
                        </View>

                        {/* switch button */}
                        <Button
                            onPress={this.switchCurrency}
                            roundedSmall
                            icon="IconCornerRightUp"
                            iconStyle={AppStyles.imgColorBlue}
                            iconSize={15}
                            textStyle={AppStyles.colorBlue}
                            label="Switch"
                            style={styles.switchButton}
                            hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                        />
                    </View>

                    {/* to part */}
                    <View style={styles.toContainer}>
                        <View style={[AppStyles.row]}>
                            <View style={[AppStyles.row, AppStyles.flex1]}>
                                {fromCurrency !== 'XRP' ? (
                                    <View style={[styles.xrpAvatarContainer]}>
                                        <Image source={Images.IconXrpNew} style={[styles.xrpAvatar]} />
                                    </View>
                                ) : (
                                    <View style={[styles.brandAvatarContainer]}>
                                        <Image
                                            style={[styles.brandAvatar]}
                                            source={{ uri: trustLine.counterParty.avatar }}
                                        />
                                    </View>
                                )}
                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text style={[styles.currencyLabel]}>
                                        {fromCurrency !== 'XRP'
                                            ? 'XRP'
                                            : trustLine.currency.name ||
                                              NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                </View>
                            </View>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <Text style={styles.toAmount}>~</Text>
                                <TextInput
                                    keyboardType="decimal-pad"
                                    autoCapitalize="words"
                                    style={styles.toAmount}
                                    placeholderTextColor={AppColors.green}
                                    placeholder="0"
                                    value={getsAmount || '0'}
                                />
                            </View>
                        </View>
                        <Spacer />
                        <View>
                            <Text style={[styles.subLabel]}>
                                {fromCurrency === 'XRP' &&
                                    `${trustLine.counterParty.name} ${NormalizeCurrencyCode(
                                        trustLine.currency.currency,
                                    )}`}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.bottomContainer}>
                        {exchangeRate === 0 ? (
                            <InfoMessage type="error" label={Localize.t('exchange.liquidityIsNotEnough')} />
                        ) : (
                            <>
                                <Text style={[styles.subLabel, AppStyles.textCenterAligned]}>
                                    {Localize.t('exchange.exchangeRate', { exchangeRate: exchangeRate || '' })}
                                </Text>
                                <Spacer size={40} />
                                <Button
                                    onPress={this.exchange}
                                    isLoading={isExchanging}
                                    isDisabled={!paysAmount || paysAmount === '0' || !exchangeRate}
                                    label={Localize.t('global.exchange')}
                                />
                            </>
                        )}
                    </View>
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ExchangeView;
