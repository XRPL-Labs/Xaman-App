/**
 * Exchange currency Screen
 */
import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import {
    View,
    SafeAreaView,
    ScrollView,
    Text,
    Image,
    Alert,
    TextInput,
    Keyboard,
    Linking,
    TouchableOpacity,
    InteractionManager,
    ActivityIndicator,
} from 'react-native';

import { Result as LiquidityResult } from 'xrpl-orderbook-reader';

import { Images } from '@common/helpers/images';
import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { TrustLineSchema, AccountSchema } from '@store/schemas/latest';
import { AccountRepository } from '@store/repositories';

import LedgerExchange from '@common/libs/ledger/exchange';
import { OfferCreate } from '@common/libs/ledger/transactions';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { NormalizeCurrencyCode } from '@common/libs/utils';
// constants
import { AppScreens, AppConfig } from '@common/constants';

// components
import { AmountInput, Header, Spacer, Icon, Button, InfoMessage } from '@components/General';

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
    direction: 'sell' | 'buy';
    amount: string;
    liquidity: LiquidityResult;
    offer: OfferCreate;
    isLoading: boolean;
    isPreparing: boolean;
    isExchanging: boolean;
    isVerifying: boolean;
}

/* Component ==================================================================== */
class ExchangeView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Exchange;

    timeout: any;
    sequence: number;
    ledgerExchange: LedgerExchange;
    amountInput: AmountInput;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            sourceAccount: AccountRepository.getDefaultAccount(),
            direction: 'sell',
            amount: '',
            liquidity: undefined,
            offer: new OfferCreate(),
            isLoading: true,
            isPreparing: false,
            isExchanging: false,
            isVerifying: false,
        };

        const PAIR = { issuer: props.trustLine.currency.issuer, currency: props.trustLine.currency.currency };
        this.ledgerExchange = new LedgerExchange(PAIR);

        this.timeout = null;
        this.sequence = 0;
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.ledgerExchange.initialize().then(() => {
                this.checkLiquidity();
            });
        });
    }

    checkLiquidity = async () => {
        const { direction, amount } = this.state;

        clearTimeout(this.timeout);

        this.timeout = setTimeout(() => {
            // increase sequence
            this.sequence += 1;
            // get a copy of sequence
            const { sequence } = this;

            this.setState({
                isLoading: true,
            });

            this.ledgerExchange
                .getLiquidity(direction, Number(amount))
                .then((res) => {
                    // this will make sure the latest call will apply
                    if (sequence === this.sequence) {
                        this.setState({
                            liquidity: res,
                        });
                    }
                })
                .finally(() => {
                    this.setState({
                        isLoading: false,
                    });
                });
        }, 500);
    };

    openXRPToolkit = () => {
        Linking.canOpenURL(AppConfig.thirdParty.XRPToolkit).then((supported) => {
            if (supported) {
                Linking.openURL(AppConfig.thirdParty.XRPToolkit);
            } else {
                Alert.alert(Localize.t('global.error'), Localize.t('global.cannotOpenLink'));
            }
        });
    };

    switchDirection = () => {
        const { direction } = this.state;

        this.setState(
            {
                direction: direction === 'buy' ? 'sell' : 'buy',
                isLoading: true,
            },
            () => {
                this.checkLiquidity();
            },
        );
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
        const { direction, liquidity, amount } = this.state;

        // calculate gets amount
        const getsAmount = new BigNumber(amount).multipliedBy(liquidity.rate).decimalPlaces(3).toString(10);

        // dismiss keyboard if present
        Keyboard.dismiss();

        // get available balance
        const availableBalance = this.getAvailableBalance();

        // check if user can spend this much
        if (parseFloat(amount) > availableBalance) {
            Prompt(
                Localize.t('global.error'),
                Localize.t('exchange.theMaxAmountYouCanExchangeIs', {
                    spendable: Localize.formatNumber(availableBalance),
                    currency: direction === 'sell' ? 'XRP' : NormalizeCurrencyCode(trustLine.currency.currency),
                }),
                [
                    { text: Localize.t('global.cancel') },
                    {
                        text: Localize.t('global.update'),
                        onPress: () => {
                            this.setState({
                                amount: availableBalance.toString(),
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
                payAmount: Localize.formatNumber(Number(amount)),
                payCurrency: direction === 'sell' ? 'XRP' : NormalizeCurrencyCode(trustLine.currency.currency),
                getAmount: Localize.formatNumber(Number(getsAmount)),
                getCurrency: direction === 'sell' ? NormalizeCurrencyCode(trustLine.currency.currency) : 'XRP',
            }),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.doIt'),

                    onPress: this.prepareAndSign,
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    prepareAndSign = async () => {
        const { trustLine } = this.props;
        const { sourceAccount, offer, amount, direction, liquidity } = this.state;

        this.setState({ isPreparing: true });

        const XRPL_PAIR = { issuer: trustLine.currency.issuer, currency: trustLine.currency.currency };

        const paddedExchangeRate = new BigNumber(liquidity.rate).dividedBy(
            (100 + this.ledgerExchange.boundaryOptions.maxSlippagePercentage) / 100,
        );

        const getsAmount = new BigNumber(amount).multipliedBy(paddedExchangeRate).decimalPlaces(8).toString(10);

        if (direction === 'sell') {
            offer.TakerGets = { currency: 'XRP', value: amount };
            offer.TakerPays = { value: getsAmount, ...XRPL_PAIR };
        } else {
            offer.TakerGets = { value: amount, ...XRPL_PAIR };
            offer.TakerPays = { currency: 'XRP', value: getsAmount };
        }

        // ImmediateOrCancel & Sell flag
        offer.Flags = [txFlags.OfferCreate.ImmediateOrCancel, txFlags.OfferCreate.Sell];

        // set source account
        offer.Account = { address: sourceAccount.address };

        offer
            .sign(sourceAccount)
            .then(this.submit)
            .catch((e) => {
                if (e) {
                    Alert.alert(Localize.t('global.error'), e.message);
                }
            })
            .finally(() => {
                this.setState({
                    isPreparing: false,
                });
            });
    };

    submit = async () => {
        const { sourceAccount, offer } = this.state;

        this.setState({ isExchanging: true });

        // submit to the ledger
        const submitResult = await offer.submit();

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
                // calculate delivered amounts
                const takerGot = offer.TakerGot(sourceAccount.address);
                const takerPaid = offer.TakerPaid(sourceAccount.address);

                this.showResultAlert(
                    Localize.t('global.success'),
                    Localize.t('exchange.successfullyExchanged', {
                        payAmount: Localize.formatNumber(Number(takerGot.value)),
                        payCurrency: NormalizeCurrencyCode(takerGot.currency),
                        getAmount: Localize.formatNumber(Number(takerPaid.value)),
                        getCurrency: NormalizeCurrencyCode(takerPaid.currency),
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

    onAmountChange = (amount: string) => {
        this.setState(
            {
                amount,
            },
            () => {
                this.checkLiquidity();
            },
        );
    };

    getAvailableBalance = () => {
        const { trustLine } = this.props;
        const { direction, sourceAccount } = this.state;

        let availableBalance;

        if (direction === 'sell') {
            availableBalance = sourceAccount.availableBalance;
        } else {
            availableBalance = trustLine.balance;
        }

        return availableBalance;
    };

    renderBottomContainer = () => {
        const { direction, liquidity, amount, isPreparing, isLoading } = this.state;

        if (isLoading || !liquidity) {
            return <ActivityIndicator color={AppColors.blue} />;
        }

        if (liquidity.errors && liquidity.errors.length > 0) {
            let errorsText = '';

            liquidity.errors.forEach((e, i) => {
                errorsText += `* ${this.ledgerExchange.errors[e]}`;
                if (i + 1 < liquidity.errors.length) {
                    errorsText += '\n';
                }
            });

            return (
                <>
                    <InfoMessage type="error" label={errorsText} />
                    <Spacer />
                    <InfoMessage type="info">
                        <Text style={[AppStyles.subtext, AppStyles.textCenterAligned]}>
                            {Localize.t('exchange.exchangeByThirdPartyMessage')}
                        </Text>
                        <Spacer size={30} />
                        <Button
                            onPress={this.openXRPToolkit}
                            icon="IconLink"
                            iconStyle={AppStyles.imgColorGreyDark}
                            light
                            rounded
                            label={Localize.t('global.openXRPToolkitByTowoLabs')}
                            textStyle={[AppStyles.subtext, AppStyles.bold]}
                            adjustsFontSizeToFit
                            numberOfLines={1}
                        />
                    </InfoMessage>
                    <Spacer size={40} />
                </>
            );
        }

        const exchangeRate =
            direction === 'sell'
                ? liquidity.rate
                : new BigNumber(1).dividedBy(liquidity.rate).decimalPlaces(8).toString(10);

        return (
            <>
                <Text style={[styles.subLabel, AppStyles.textCenterAligned]}>
                    {Localize.t('exchange.exchangeRate', { exchangeRate: Localize.formatNumber(Number(exchangeRate)) })}
                </Text>
                <Spacer size={40} />
                <Button
                    onPress={this.exchange}
                    isLoading={isPreparing}
                    isDisabled={!amount || amount === '0' || !liquidity.rate || isLoading}
                    label={Localize.t('global.exchange')}
                />
            </>
        );
    };

    applyAllBalance = () => {
        this.setState({
            amount: this.getAvailableBalance().toString(),
        });
    };

    render() {
        const { trustLine } = this.props;
        const { direction, liquidity, amount, isExchanging, isVerifying } = this.state;

        let getsAmount = '0';

        if (liquidity?.rate) {
            getsAmount = new BigNumber(amount || 0).multipliedBy(liquidity.rate).decimalPlaces(3).toString(10);
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
                        <View style={AppStyles.row}>
                            <View style={[AppStyles.row, AppStyles.flex1]}>
                                {direction === 'sell' ? (
                                    <View style={[styles.currencyImageContainer, styles.xrpImageContainer]}>
                                        <Image source={Images.IconXrpNew} style={[styles.currencyImage]} />
                                    </View>
                                ) : (
                                    <View style={[styles.currencyImageContainer, styles.iouImageContainer]}>
                                        <Image
                                            style={[styles.currencyImage]}
                                            source={{ uri: trustLine.counterParty.avatar }}
                                        />
                                    </View>
                                )}
                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text style={[styles.currencyLabel]}>
                                        {direction === 'sell'
                                            ? 'XRP'
                                            : trustLine.currency.name ||
                                              NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                    <Text style={[styles.subLabel]}>
                                        {Localize.t('global.spendable')}:{' '}
                                        {Localize.formatNumber(this.getAvailableBalance())}
                                    </Text>
                                </View>
                            </View>
                            <View>
                                <Button
                                    onPress={this.applyAllBalance}
                                    style={styles.allButton}
                                    label={Localize.t('global.all')}
                                    roundedMini
                                    textStyle={AppStyles.colorBlue}
                                    icon="IconArrowDown"
                                    iconStyle={AppStyles.imgColorBlue}
                                    iconSize={10}
                                />
                            </View>
                        </View>
                        <Spacer />

                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => {
                                if (this.amountInput) {
                                    this.amountInput.focus();
                                }
                            }}
                            style={[styles.inputContainer]}
                        >
                            <Text style={styles.fromAmount}>-</Text>
                            <AmountInput
                                ref={(r) => {
                                    this.amountInput = r;
                                }}
                                onChange={this.onAmountChange}
                                placeholderTextColor={AppColors.red}
                                style={styles.fromAmount}
                                value={amount}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* switch button */}
                    <View>
                        <Button
                            onPress={this.switchDirection}
                            roundedSmall
                            icon="IconCornerRightUp"
                            iconStyle={AppStyles.imgColorBlue}
                            iconSize={15}
                            textStyle={AppStyles.colorBlue}
                            label={Localize.t('global.switch')}
                            style={styles.switchButton}
                            hitSlop={{ top: 30, bottom: 30, left: 30, right: 30 }}
                        />
                    </View>

                    {/* to part */}
                    <View style={styles.toContainer}>
                        <View style={[AppStyles.row]}>
                            <View style={[AppStyles.row, AppStyles.flex1]}>
                                {direction === 'buy' ? (
                                    <View style={[styles.currencyImageContainer, styles.xrpImageContainer]}>
                                        <Image source={Images.IconXrpNew} style={[styles.currencyImage]} />
                                    </View>
                                ) : (
                                    <View style={[styles.currencyImageContainer, styles.iouImageContainer]}>
                                        <Image
                                            style={[styles.currencyImage]}
                                            source={{ uri: trustLine.counterParty.avatar }}
                                        />
                                    </View>
                                )}
                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text style={[styles.currencyLabel]}>
                                        {direction === 'buy'
                                            ? 'XRP'
                                            : trustLine.currency.name ||
                                              NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                    {direction === 'sell' && (
                                        <Text style={[styles.subLabel]}>
                                            {trustLine.counterParty.name}{' '}
                                            {NormalizeCurrencyCode(trustLine.currency.currency)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                        <Spacer />

                        <View style={[styles.inputContainer]}>
                            <Text style={styles.toAmount}>~</Text>
                            <TextInput
                                style={styles.toAmount}
                                placeholderTextColor={AppColors.green}
                                placeholder="0"
                                value={Localize.formatNumber(Number(getsAmount)) || '0'}
                                editable={false}
                            />
                        </View>
                    </View>

                    {/* bottom part */}
                    <ScrollView bounces={false} style={styles.bottomContainer}>
                        {this.renderBottomContainer()}
                    </ScrollView>
                </View>
            </View>
        );
    }
}

/* Export Component ==================================================================== */
export default ExchangeView;
