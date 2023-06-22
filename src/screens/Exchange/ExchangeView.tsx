/**
 * Exchange currency Screen
 */
import BigNumber from 'bignumber.js';
import React, { Component } from 'react';
import { Animated, View, ScrollView, Text, Keyboard, InteractionManager } from 'react-native';

import { Result as LiquidityResult } from 'xrpl-orderbook-reader';

import { AppScreens } from '@common/constants';

import { Prompt, Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import NetworkService from '@services/NetworkService';

import { TrustLineSchema, AccountSchema } from '@store/schemas/latest';

import { Payload } from '@common/libs/payload';

import LedgerExchange, { MarketDirection } from '@common/libs/ledger/exchange';
import { OfferCreate } from '@common/libs/ledger/transactions';
import { OfferStatus } from '@common/libs/ledger/parser/types';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';

// components
import {
    AmountText,
    AmountInput,
    Header,
    Spacer,
    Button,
    InfoMessage,
    LoadingIndicator,
    HorizontalLine,
    TokenAvatar,
} from '@components/General';

import { AmountValueType } from '@components/General/AmountInput';

import Localize from '@locale';

// style
import { AppStyles, AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    trustLine: TrustLineSchema;
}

export interface State {
    direction: MarketDirection;
    amount: string;
    expectedOutcome: string;
    minimumOutcome: string;
    exchangeRate: string;
    liquidity: LiquidityResult;
    isLoading: boolean;
    isExchanging: boolean;
}

/* Component ==================================================================== */
class ExchangeView extends Component<Props, State> {
    static screenName = AppScreens.Transaction.Exchange;

    private timeout: any;
    private sequence: number;
    private ledgerExchange: LedgerExchange;
    private amountInput: React.RefObject<typeof AmountInput | null>;
    private animatedOpacity: Animated.Value;
    private mounted: boolean;

    static options() {
        return {
            bottomTabs: { visible: false },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            direction: MarketDirection.SELL,
            amount: '',
            expectedOutcome: '',
            minimumOutcome: '',
            exchangeRate: '',
            liquidity: undefined,
            isLoading: true,
            isExchanging: false,
        };

        // create new ledger exchange instance base on pair
        this.ledgerExchange = new LedgerExchange({
            issuer: props.trustLine.currency.issuer,
            currency: props.trustLine.currency.currency,
        });

        this.amountInput = React.createRef();
        this.animatedOpacity = new Animated.Value(1);
        this.timeout = null;
        this.sequence = 0;
        this.mounted = true;
    }

    componentDidMount() {
        this.mounted = true;

        InteractionManager.runAfterInteractions(() => {
            if (this.ledgerExchange) {
                this.ledgerExchange.initialize(MarketDirection.SELL).then(() => {
                    this.updateOutcomes(false);
                });
            }
        });
    }

    componentWillUnmount() {
        this.mounted = false;

        if (this.timeout) {
            clearTimeout(this.timeout);
        }
    }

    updateOutcomes = (fadeEffect = true) => {
        const { direction, amount } = this.state;

        clearTimeout(this.timeout);

        this.timeout = setTimeout(async () => {
            if (!this.ledgerExchange || !this.mounted) return;

            // increase sequence
            this.sequence += 1;
            // get a copy of sequence
            const { sequence } = this;

            this.setState(
                {
                    isLoading: true,
                },
                () => {
                    if (fadeEffect) {
                        Animated.timing(this.animatedOpacity, {
                            toValue: 0.5,
                            duration: 350,
                            useNativeDriver: false,
                        }).start();
                    }
                },
            );

            try {
                const liquidity = await this.ledgerExchange.getLiquidity(direction, Number(amount));

                // this will make sure the latest call will apply
                if (sequence === this.sequence && liquidity && this.mounted) {
                    const { expected, minimum } = this.ledgerExchange.calculateOutcomes(amount, liquidity, direction);
                    const exchangeRate = this.ledgerExchange.calculateExchangeRate(liquidity, direction);

                    this.setState({
                        liquidity,
                        expectedOutcome: expected,
                        minimumOutcome: minimum,
                        exchangeRate,
                    });
                }
            } catch {
                // for consistently result if we cannot fetch the liquidity set it to undefined
                this.setState({
                    expectedOutcome: '',
                    minimumOutcome: '',
                    exchangeRate: '',
                    liquidity: undefined,
                });
                Toast(Localize.t('payload.unableToCheckAssetConversion'));
            } finally {
                if (this.mounted) {
                    this.setState(
                        {
                            isLoading: false,
                        },
                        () => {
                            if (fadeEffect) {
                                Animated.timing(this.animatedOpacity, {
                                    toValue: 1,
                                    duration: 350,
                                    useNativeDriver: false,
                                }).start();
                            }
                        },
                    );
                }
            }
        }, 500);
    };

    switchDirection = () => {
        const { direction } = this.state;

        this.setState(
            {
                direction: direction === MarketDirection.BUY ? MarketDirection.SELL : MarketDirection.BUY,
                amount: '',
                expectedOutcome: '',
                minimumOutcome: '',
                liquidity: undefined,
            },
            () => {
                this.updateOutcomes(false);
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

    onExchangePress = () => {
        const { trustLine } = this.props;
        const { direction, amount, expectedOutcome } = this.state;

        // dismiss keyboard if present
        Keyboard.dismiss();

        // get available balance
        const availableBalance = this.getAvailableBalance();

        // check if user can spend this much
        if (parseFloat(amount) > availableBalance) {
            Prompt(
                Localize.t('global.error'),
                Localize.t('exchange.theMaxAmountYouCanExchangeIs', {
                    spendable: Localize.formatNumber(availableBalance, 16),
                    currency:
                        direction === MarketDirection.SELL
                            ? NetworkService.getNativeAsset()
                            : NormalizeCurrencyCode(trustLine.currency.currency),
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

        Prompt(
            Localize.t('global.exchange'),
            Localize.t('exchange.doYouWantToExchange', {
                payAmount: Localize.formatNumber(Number(amount)),
                payCurrency:
                    direction === MarketDirection.SELL
                        ? NetworkService.getNativeAsset()
                        : NormalizeCurrencyCode(trustLine.currency.currency),
                getAmount: Localize.formatNumber(Number(expectedOutcome)),
                getCurrency:
                    direction === MarketDirection.SELL
                        ? NormalizeCurrencyCode(trustLine.currency.currency)
                        : NetworkService.getNativeAsset(),
            }),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.doIt'),

                    onPress: this.showSlippageWarning,
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    showSlippageWarning = () => {
        Prompt(
            Localize.t('global.pleaseNote'),
            Localize.t('exchange.slippageSpreadWarning', {
                slippage: this.ledgerExchange.boundaryOptions.maxSlippagePercentage,
            }),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('exchange.iAcceptExchange'),

                    onPress: this.prepareAndSign,
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    prepareAndSign = async () => {
        const { account, trustLine } = this.props;
        const { amount, minimumOutcome, direction } = this.state;

        this.setState({ isExchanging: true });

        const pair = { issuer: trustLine.currency.issuer, currency: trustLine.currency.currency };

        // create offerCreate transaction
        const offer = new OfferCreate({
            Account: account.address,
        });

        // set offer values
        if (direction === MarketDirection.SELL) {
            offer.TakerGets = { currency: NetworkService.getNativeAsset(), value: amount };
            offer.TakerPays = { value: minimumOutcome, ...pair };
        } else {
            offer.TakerGets = { value: amount, ...pair };
            offer.TakerPays = { currency: NetworkService.getNativeAsset(), value: minimumOutcome };
        }

        // ImmediateOrCancel & Sell flag
        offer.Flags = [txFlags.OfferCreate.ImmediateOrCancel, txFlags.OfferCreate.Sell];

        // generate payload
        const payload = Payload.build(offer.Json);

        Navigator.showModal(
            AppScreens.Modal.ReviewTransaction,
            {
                payload,
                onResolve: this.onReviewScreenResolve,
                onClose: this.onReviewScreenClose,
            },
            { modalPresentationStyle: 'fullScreen' },
        );
    };

    onReviewScreenClose = () => {
        this.setState({
            isExchanging: false,
        });
    };

    onReviewScreenResolve = (offer: OfferCreate) => {
        const { account } = this.props;

        this.setState({
            isExchanging: false,
        });

        if (offer.TransactionResult?.success === false) {
            this.showResultAlert(
                Localize.t('global.error'),
                Localize.t('exchange.errorDuringExchange', {
                    error: offer.TransactionResult.message || 'UNKNOWN ERROR',
                }),
            );
            return;
        }

        if ([OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].indexOf(offer.GetOfferStatus(account.address)) > -1) {
            // calculate delivered amounts
            const takerGot = offer.TakerGot(account.address);
            const takerPaid = offer.TakerPaid(account.address);

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
    };

    onAmountChange = (amount: string) => {
        this.setState(
            {
                amount,
            },
            () => {
                this.updateOutcomes(true);
            },
        );
    };

    getAvailableBalance = () => {
        const { account, trustLine } = this.props;
        const { direction } = this.state;

        let availableBalance;

        if (direction === MarketDirection.SELL) {
            availableBalance = CalculateAvailableBalance(account);
        } else {
            availableBalance = trustLine.balance;
        }

        return availableBalance;
    };

    applyAllBalance = () => {
        const { account, trustLine } = this.props;
        const { direction } = this.state;

        let availableBalance = '0';

        if (direction === MarketDirection.SELL) {
            availableBalance = new BigNumber(CalculateAvailableBalance(account)).toString();
        } else {
            availableBalance = new BigNumber(trustLine.balance).toString();
        }

        this.onAmountChange(availableBalance);
    };

    renderErrors = () => {
        const { liquidity } = this.state;

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
                </InfoMessage>
                <Spacer size={40} />
            </>
        );
    };

    renderBottomContainer = () => {
        const { trustLine } = this.props;
        const { direction, liquidity, amount, exchangeRate, minimumOutcome, isExchanging, isLoading } = this.state;

        if (isLoading || !liquidity) {
            return <LoadingIndicator />;
        }

        if (liquidity.errors && liquidity.errors.length > 0) {
            return this.renderErrors();
        }

        const { maxSlippagePercentage } = this.ledgerExchange.boundaryOptions;

        return (
            <>
                <View style={styles.detailsContainer}>
                    <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>{Localize.t('exchange.exchangeRate')}</Text>
                        <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                            <AmountText
                                value={exchangeRate}
                                currency={`${NormalizeCurrencyCode(
                                    trustLine.currency.currency,
                                )}/${NetworkService.getNativeAsset()}`}
                                style={[styles.detailsValue, AppStyles.textRightAligned]}
                                immutable
                            />
                        </View>
                    </View>
                    <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>{Localize.t('exchange.minimumReceived')}</Text>
                        <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                            <AmountText
                                value={minimumOutcome}
                                currency={
                                    direction === MarketDirection.SELL
                                        ? trustLine.currency.currency
                                        : NetworkService.getNativeAsset()
                                }
                                style={[styles.detailsValue, AppStyles.textRightAligned, AppStyles.colorRed]}
                                immutable
                            />
                        </View>
                    </View>
                    <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>{Localize.t('exchange.slippageTolerance')}</Text>
                        <View style={[AppStyles.flex1, AppStyles.rightAligned]}>
                            <Text style={[styles.detailsValue, AppStyles.textCenterAligned]}>
                                {`${maxSlippagePercentage}%`}
                            </Text>
                        </View>
                    </View>
                </View>
                <Spacer size={40} />
                <Button
                    onPress={this.onExchangePress}
                    isLoading={isExchanging}
                    isDisabled={!amount || amount === '0' || !liquidity || isLoading}
                    label={Localize.t('global.exchange')}
                />
            </>
        );
    };

    render() {
        const { trustLine } = this.props;
        const { direction, amount, expectedOutcome } = this.state;

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
                                <View style={styles.currencyImageContainer}>
                                    <TokenAvatar
                                        token={
                                            direction === MarketDirection.SELL
                                                ? NetworkService.getNativeAsset()
                                                : trustLine
                                        }
                                        border
                                        size={37}
                                    />
                                </View>

                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text style={styles.currencyLabel}>
                                        {direction === MarketDirection.SELL
                                            ? NetworkService.getNativeAsset()
                                            : trustLine.currency.name ||
                                              NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                    <Text style={styles.subLabel}>
                                        {Localize.t('global.spendable')}:{' '}
                                        {Localize.formatNumber(this.getAvailableBalance())}
                                    </Text>
                                </View>
                            </View>
                            <View>
                                <Button
                                    secondary
                                    roundedSmall
                                    onPress={this.applyAllBalance}
                                    label={Localize.t('global.all')}
                                    icon="IconArrowDown"
                                    iconSize={10}
                                />
                            </View>
                        </View>
                        <Spacer />

                        <View style={styles.inputContainer}>
                            <Text style={styles.fromAmount}>-</Text>
                            <View style={AppStyles.flex1}>
                                <AmountInput
                                    ref={this.amountInput}
                                    value={amount}
                                    valueType={
                                        direction === MarketDirection.SELL
                                            ? AmountValueType.Native
                                            : AmountValueType.IOU
                                    }
                                    onChange={this.onAmountChange}
                                    placeholderTextColor={AppColors.red}
                                    style={styles.fromAmount}
                                />
                            </View>
                        </View>
                    </View>

                    {/* switch button */}
                    <View>
                        <HorizontalLine style={styles.separatorLine} />
                        <Button
                            activeOpacity={0.9}
                            roundedSmall
                            onPress={this.switchDirection}
                            icon="IconCornerRightUp"
                            iconSize={15}
                            label={Localize.t('global.switch')}
                            style={styles.switchButton}
                        />
                    </View>

                    {/* to part */}
                    <View style={styles.toContainer}>
                        <View style={AppStyles.row}>
                            <View style={[AppStyles.row, AppStyles.flex1]}>
                                <View style={styles.currencyImageContainer}>
                                    <TokenAvatar
                                        token={
                                            direction === MarketDirection.BUY
                                                ? NetworkService.getNativeAsset()
                                                : trustLine
                                        }
                                        border
                                        size={37}
                                    />
                                </View>
                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text style={styles.currencyLabel}>
                                        {direction === MarketDirection.BUY
                                            ? NetworkService.getNativeAsset()
                                            : trustLine.currency.name ||
                                              NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                    {direction === MarketDirection.SELL && (
                                        <Text style={styles.subLabel}>
                                            {trustLine.counterParty.name}{' '}
                                            {NormalizeCurrencyCode(trustLine.currency.currency)}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                        <Spacer />

                        <Animated.View style={[styles.inputContainer, { opacity: this.animatedOpacity }]}>
                            <Text style={styles.toAmount}>~</Text>
                            <AmountText value={expectedOutcome} style={styles.toAmount} numberOfLines={1} immutable />
                        </Animated.View>
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
