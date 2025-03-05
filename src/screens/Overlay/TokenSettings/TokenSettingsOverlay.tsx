/**
 * Token Settings Overlay
 */
import { get, has } from 'lodash';
import BigNumber from 'bignumber.js';

import React, { Component } from 'react';
import { Platform, Alert, Animated, InteractionManager, Text, View, GestureResponderEvent } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { TrustLineRepository } from '@store/repositories';

import { Payload, XAppOrigin } from '@common/libs/payload';

import { Payment, TrustSet } from '@common/libs/ledger/transactions';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { MutationsMixinType, SignMixinType } from '@common/libs/ledger/mixin/types';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { Prompt, Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Clipboard } from '@common/helpers/clipboard';

import { AppScreens, AppConfig } from '@common/constants';

import LedgerService from '@services/LedgerService';
import NetworkService from '@services/NetworkService';

// components
import { AmountText, Button, Icon, InfoMessage, RaisedButton, Spacer, TouchableDebounce } from '@components/General';
import { TokenAvatar, TokenIcon } from '@components/Modules/TokenElement';

import Localize from '@locale';

import { SendViewProps } from '@screens/Send';
import { ExchangeViewProps } from '@screens/Exchange';
import { XAppBrowserModalProps } from '@screens/Modal/XAppBrowser';
import { ReviewTransactionModalProps } from '@screens/Modal/ReviewTransaction';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
import { Props, State } from './types';

/* Component ==================================================================== */
class TokenSettingsOverlay extends Component<Props, State> {
    static screenName = AppScreens.Overlay.TokenSettings;
    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;
    private mounted: boolean;

    static options() {
        return {
            topBar: {
                visible: false,
            },
        };
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            isFavorite: !!props.token.favorite,
            hasXAppIdentifier: !!props.token.currency.xappIdentifier,
            isRemoving: false,
            isLoading: false,
            isReviewScreenVisible: false,
            latestLineBalance: 0,
            canRemove: false,
        };

        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(0);

        this.mounted = false;
    }

    componentDidMount() {
        this.mounted = true;

        Animated.parallel([
            Animated.timing(this.animatedColor, {
                toValue: 150,
                duration: 350,
                useNativeDriver: false,
            }),
            Animated.timing(this.animatedOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: false,
            }),
        ]).start();

        this.getLatestLineBalance();
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    dismiss = () => {
        return new Promise<void>((resolve) => {
            Animated.parallel([
                Animated.timing(this.animatedColor, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: false,
                }),
                Animated.timing(this.animatedOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: false,
                }),
            ]).start(async () => {
                await Navigator.dismissOverlay();
                return resolve();
            });
        });
    };

    copyIssuerAddress = () => {
        const { token } = this.props;

        Clipboard.setString(token.currency.issuer);
        Toast(Localize.t('asset.issuerAddressCopiedToClipboard'));
    };

    onCopyIssuerAddressPress = () => {
        const { token } = this.props;

        Navigator.showAlertModal({
            type: 'warning',
            text: Localize.t('asset.copyIssuerAddressWarning', {
                issuerAddress: token.currency.issuer,
            }),
            buttons: [
                {
                    text: Localize.t('global.cancel'),
                    type: 'dismiss',
                    light: true,
                },
                {
                    text: Localize.t('global.IUnderstand'),
                    onPress: this.copyIssuerAddress,
                    type: 'continue',
                    light: false,
                },
            ],
        });
    };

    getLatestLineBalance = (): Promise<void> => {
        const { account, token } = this.props;

        // ignore obligation lines
        if (token.obligation) return Promise.resolve();

        return new Promise((resolve) => {
            LedgerService.getFilteredAccountLine(account.address, {
                issuer: token.currency.issuer,
                currency: token.currency.currencyCode,
            })
                .then((line) => {
                    if (line) {
                        const balance = new BigNumber(line.balance);

                        if (this.mounted) {
                            this.setState(
                                {
                                    latestLineBalance: balance.toNumber(),
                                    canRemove: balance.isLessThan(0.0001),
                                },
                                resolve,
                            );
                        }
                    } else {
                        resolve();
                    }
                })
                .catch(() => {
                    resolve();
                });
        });
    };

    clearDustAmounts = async () => {
        const { latestLineBalance } = this.state;
        const { token, account } = this.props;

        try {
            this.setState({
                isRemoving: true,
            });

            const paymentJson = {
                TransactionType: TransactionTypes.Payment,
                Account: account.address,
                Destination: token.currency.issuer,
                DestinationTag: 0,
                Amount: {
                    currency: token.currency.currencyCode,
                    issuer: token.currency.issuer,
                    value: String(latestLineBalance),
                },
            };

            // add PartialPayment flag if issuer have transferFee
            const issuerAccountInfo = await LedgerService.getAccountInfo(token.currency.issuer);
            // eslint-disable-next-line max-len
            if (has(issuerAccountInfo, ['account_data', 'TransferRate'])) {
                Object.assign(paymentJson, {
                    Flags: 131072, // PartialPayment Flag
                });
            }

            // TODO: test me
            const payload = Payload.build(paymentJson);

            // await this.dismiss();

            this.setState(
                {
                    isReviewScreenVisible: true,
                },
                () => {
                    Animated.parallel([
                        Animated.timing(this.animatedColor, {
                            toValue: 0,
                            duration: 350,
                            useNativeDriver: false,
                        }),
                        Animated.timing(this.animatedOpacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: false,
                        }),
                    ]).start(() => {
                        Navigator.showModal<ReviewTransactionModalProps<Payment>>(
                            AppScreens.Modal.ReviewTransaction,
                            {
                                payload,
                                onResolve: this.onClearDustResolve,
                                onClose: this.onReviewScreenClose,
                            },
                            { modalPresentationStyle: OptionsModalPresentationStyle.fullScreen },
                        );
                    });
                },
            );
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('asset.failedRemove'));
        }
    };

    onClearDustResolve = (transaction: Payment & MutationsMixinType & SignMixinType) => {
        this.setState({
            isRemoving: false,
            isReviewScreenVisible: false,
        });

        if (transaction.TransactionResult?.success === false) {
            Alert.alert(Localize.t('global.error'), Localize.t('asset.failedRemove'));
            return;
        }

        Prompt(
            Localize.t('global.success'),
            Localize.t('asset.dustAmountRemovedYouCanRemoveTrustLineNow'),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.continue'),
                    onPress: () => {
                        this.getLatestLineBalance().then(this.removeTrustLine);
                    },
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    removeTrustLine = async () => {
        const { token, account } = this.props;
        const { latestLineBalance } = this.state;

        try {
            // there is dust balance in the account
            if (latestLineBalance !== 0) {
                Prompt(
                    Localize.t('global.warning'),
                    Localize.t('asset.trustLineDustRemoveWarning', {
                        balance: new BigNumber(latestLineBalance).toFixed(),
                        currency: NormalizeCurrencyCode(token.currency.currencyCode),
                    }),
                    [
                        { text: Localize.t('global.cancel') },
                        {
                            text: Localize.t('global.continue'),
                            onPress: this.clearDustAmounts,
                            style: 'destructive',
                        },
                    ],
                    { type: 'default' },
                );
                return;
            }

            this.setState({
                isRemoving: true,
            });

            let transactionFlags = 2097152; // tfClearFreeze

            // If the (own) account DOES HAVE the defaultRipple flag,
            //  CLEAR the noRipple flag on the Trust Line, so set: tfClearNoRipple
            if (account.flags?.defaultRipple) {
                transactionFlags |= 262144;
            } else {
                // If the (own) account DOES NOT HAVE the defaultRipple flag SET the tfSetNoRipple flag
                transactionFlags |= 131072; // tfClearNoRipple
            }

            const trustSet = new TrustSet({
                TransactionType: TransactionTypes.TrustSet,
                Account: account.address,
                LimitAmount: {
                    currency: token.currency.currencyCode,
                    issuer: token.currency.issuer,
                    value: 0,
                },
                Flags: transactionFlags,
            });

            const payload = Payload.build(trustSet.JsonForSigning);

            // await this.dismiss();

            this.setState(
                {
                    isReviewScreenVisible: true,
                },
                () => {
                    Animated.parallel([
                        Animated.timing(this.animatedColor, {
                            toValue: 0,
                            duration: 350,
                            useNativeDriver: false,
                        }),
                        Animated.timing(this.animatedOpacity, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: false,
                        }),
                    ]).start(() => {
                        Navigator.showModal<ReviewTransactionModalProps<TrustSet>>(
                            AppScreens.Modal.ReviewTransaction,
                            {
                                payload,
                                onResolve: this.onRemoveLineResolve,
                                onClose: this.onReviewScreenClose,
                            },
                            { modalPresentationStyle: OptionsModalPresentationStyle.overCurrentContext },
                        );
                    });
                },
            );
        } catch (e: any) {
            if (e) {
                InteractionManager.runAfterInteractions(() => {
                    Alert.alert(Localize.t('global.error'), e.message);
                });
            }
        }
    };

    onReviewScreenClose = () => {
        this.setState(
            {
                isRemoving: false,
                isReviewScreenVisible: false,
            },
            () => {
                Animated.parallel([
                    Animated.timing(this.animatedColor, {
                        toValue: 150,
                        duration: 350,
                        useNativeDriver: false,
                    }),
                    Animated.timing(this.animatedOpacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                ]).start();
            },
        );
    };

    onRemoveLineResolve = (transaction: TrustSet & MutationsMixinType & SignMixinType) => {
        this.setState(
            {
                isRemoving: false,
                isReviewScreenVisible: false,
            },
            () => {
                Animated.parallel([
                    Animated.timing(this.animatedColor, {
                        toValue: 150,
                        duration: 350,
                        useNativeDriver: false,
                    }),
                    Animated.timing(this.animatedOpacity, {
                        toValue: 1,
                        duration: 200,
                        useNativeDriver: false,
                    }),
                ]).start();
            },
        );

        if (transaction.TransactionResult?.success === false) {
            InteractionManager.runAfterInteractions(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('asset.failedRemove'));
            });
            return;
        }

        InteractionManager.runAfterInteractions(() => {
            Alert.alert(Localize.t('global.success'), Localize.t('asset.successRemoved'));
        });

        this.dismiss();
    };

    onRemovePress = async () => {
        Prompt(
            Localize.t('global.warning'),
            Localize.t('account.removeTrustLineWarning'),
            [
                { text: Localize.t('global.cancel') },
                {
                    text: Localize.t('global.doIt'),
                    onPress: this.removeTrustLine,
                    style: 'destructive',
                },
            ],
            { type: 'default' },
        );
    };

    onSendPress = async () => {
        const { token } = this.props;

        this.dismiss().then(() => {
            Navigator.push<SendViewProps>(AppScreens.Transaction.Payment, { token });
        });
    };

    onExchangePress = () => {
        const { account, token } = this.props;

        this.dismiss().then(() => {
            if (AppConfig.swapNetworks.indexOf(NetworkService?.getNetwork()?.key) > -1) {
                Navigator.showModal<XAppBrowserModalProps>(
                    AppScreens.Modal.XAppBrowser,
                    {
                        identifier: AppConfig.xappIdentifiers.swap,
                        noSwitching: true,
                        nativeTitle: Localize.t('global.swap'),
                        origin: XAppOrigin.XUMM,
                        params: {
                            issuer: token.currency.issuer,
                            asset: token.currency.currencyCode,
                            action: 'SWAP',
                        },    
                    },
                    {
                        modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                        modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
                    },
                );
            } else {
                Navigator.push<ExchangeViewProps>(AppScreens.Transaction.Exchange, { account, token });
            }
        });
    };

    onDepositPress = async () => {
        const { token } = this.props;

        this.dismiss().then(() => {
            Navigator.showModal<XAppBrowserModalProps>(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier: token.currency.xappIdentifier!,
                    params: {
                        issuer: token.currency.issuer,
                        asset: token.currency.currencyCode,
                        action: 'DEPOSIT',
                    },
                    origin: XAppOrigin.XUMM,
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
                },
            );
        });
    };

    onWithdrawPress = async () => {
        const { token } = this.props;

        this.dismiss().then(() => {
            Navigator.showModal<XAppBrowserModalProps>(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier: token.currency.xappIdentifier!,
                    params: {
                        issuer: token.currency.issuer,
                        asset: token.currency.currencyCode,
                        action: 'WITHDRAW',
                    },
                    origin: XAppOrigin.XUMM,
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.overFullScreen,
                },
            );
        });
    };

    onFavoritePress = () => {
        const { token } = this.props;

        this.setState({
            isFavorite: !token.favorite,
        });

        // update the trustline
        TrustLineRepository.update({
            id: token.id,
            favorite: !token.favorite,
        });
    };

    disableRippling = async () => {
        const { account, token } = this.props;

        const trustSetJson = {
            TransactionType: TransactionTypes.TrustSet,
            Account: account.address,
            LimitAmount: {
                currency: token.currency.currencyCode,
                issuer: token.currency.issuer,
                value: token.limit,
            },
            Flags: 131072, // tfSetNoRipple
        };

        const payload = Payload.build(trustSetJson);

        await this.dismiss();

        Navigator.showModal<ReviewTransactionModalProps<TrustSet>>(
            AppScreens.Modal.ReviewTransaction,
            {
                payload,
            },
            { modalPresentationStyle: OptionsModalPresentationStyle.fullScreen },
        );
    };

    updateLineLimit = async () => {
        const { account, token } = this.props;

        this.setState({
            isLoading: true,
        });
        // set the default line limit
        let lineLimit = '1000000000';

        try {
            // set the trustline limit by gateway balance if it's more than our default value
            const resp = await LedgerService.getGatewayBalances(token.currency.issuer);
            const gatewayBalances = get(resp, ['obligations', token.currency.currencyCode]);

            if (gatewayBalances && Number(gatewayBalances) > Number(lineLimit)) {
                lineLimit = gatewayBalances;
            }
        } catch {
            // ignore
        } finally {
            this.setState({
                isLoading: false,
            });
        }

        const trustSetJson = {
            TransactionType: TransactionTypes.TrustSet,
            Account: account.address,
            LimitAmount: {
                currency: token.currency.currencyCode,
                issuer: token.currency.issuer,
                value: lineLimit,
            },
            Flags: 131072, // tfSetNoRipple
        };

        const payload = Payload.build(trustSetJson);

        await this.dismiss();

        Navigator.showModal<ReviewTransactionModalProps<TrustSet>>(
            AppScreens.Modal.ReviewTransaction,
            {
                payload,
            },
            { modalPresentationStyle: OptionsModalPresentationStyle.fullScreen },
        );
    };

    showConfigurationAlert = () => {
        const { token } = this.props;

        let explanation;
        let fixMethod;

        if (token.no_ripple === false) {
            explanation = Localize.t('asset.ripplingMisconfigurationWarning', {
                token: NormalizeCurrencyCode(token.currency.currencyCode),
            });
            fixMethod = this.disableRippling;
        } else if (Number(token.limit) === 0) {
            explanation = Localize.t('asset.lineLimitMisconfigurationWarning');
            fixMethod = this.updateLineLimit;
        }

        Navigator.showAlertModal({
            type: 'warning',
            title: Localize.t('global.warning'),
            text: explanation,
            buttons: [
                {
                    text: Localize.t('global.back'),
                    type: 'dismiss',
                    light: true,
                },
                {
                    text: 'Fix',
                    onPress: fixMethod,
                    light: false,
                },
            ],
        });
    };

    canSend = () => {
        const { token } = this.props;
        return Number(token.balance) >= 0.00000001 || token.obligation;
    };

    canExchange = () => {
        const { token } = this.props;
        return !token.obligation && !token.isLiquidityPoolToken();
    };

    startTouch = (event: GestureResponderEvent) => {
        const targetInstance = event && typeof event === 'object'
            ? (event as any)?._targetInst
            : {};
        
        if (
            targetInstance &&
            typeof targetInstance === 'object' &&
            targetInstance?.pendingProps
        ) {
            if (
                targetInstance.pendingProps?.testID &&
                targetInstance.pendingProps?.testID === 'currency-settings-overlay' &&
                targetInstance.pendingProps?.style &&
                typeof targetInstance.pendingProps?.style === 'object' &&
                targetInstance.pendingProps?.style?.opacity === 0
            ) {
                event?.preventDefault();
                event?.stopPropagation();
                this.dismiss();
            }
        }
    };

    render() {
        const { token } = this.props;
        const { isFavorite, isReviewScreenVisible, isRemoving, isLoading, canRemove, hasXAppIdentifier } = this.state;

        if (Platform.OS === 'ios' && isReviewScreenVisible) {
            // IOS will be at the back
            return null;
        }

        // Android is screwed and needs fixes
        const visibilityAndPointer: {
            pointerEvents: 'auto' | 'none';
            display?: 'flex' | 'none';
        } =
            isReviewScreenVisible && Platform.OS === 'android'
                ? { pointerEvents: 'none', display: 'none' }
                : { pointerEvents: 'auto' };

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View
                needsOffscreenAlphaCompositing
                testID="currency-settings-overlay"
                style={[styles.container, {
                    opacity: this.animatedOpacity,
                    backgroundColor: interpolateColor,
                    ...visibilityAndPointer,
                }]}
                onTouchStart={this.startTouch}
            >
                <Animated.View style={styles.visibleContent}>
                    <View style={styles.headerContainer}>
                        <TouchableDebounce style={styles.favoriteContainer} onPress={this.onFavoritePress}>
                            <Icon
                                size={20}
                                name="IconStarFull"
                                style={[styles.favoriteIcon, isFavorite && styles.favoriteIconActive]}
                            />
                            <Text style={[styles.favoriteText, isFavorite && styles.favoriteTextActive]}>
                                {isFavorite ? Localize.t('global.favorite') : Localize.t('global.addToFavorites')}
                            </Text>
                        </TouchableDebounce>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                            <Button label={Localize.t('global.close')} roundedSmall light onPress={this.dismiss} />
                        </View>
                    </View>
                    <View style={styles.contentContainer}>
                        <View style={styles.tokenElement}>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <View style={styles.brandAvatarContainer}>
                                    <TokenAvatar token={token} border size={35} />
                                </View>
                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text
                                        numberOfLines={1}
                                        style={styles.currencyItemLabelSmall}
                                        ellipsizeMode="middle"
                                    >
                                        {token.getFormattedCurrency()}
                                    </Text>
                                    <TouchableDebounce
                                        onPress={this.onCopyIssuerAddressPress}
                                        style={AppStyles.row}
                                        activeOpacity={1}
                                    >
                                        <Text style={styles.issuerLabel}>{token.getFormattedIssuer()}</Text>
                                        <Icon style={styles.copyIcon} name="IconCopy" size={15} />
                                    </TouchableDebounce>
                                </View>
                            </View>
                            <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                <AmountText
                                    value={token.balance}
                                    style={[AppStyles.pbold, AppStyles.monoBold]}
                                    prefix={<TokenIcon token={token} style={styles.tokenIconContainer} />}
                                />
                            </View>
                        </View>

                        {(!token.no_ripple || Number(token.limit) === 0) &&
                            !token.obligation &&
                            !token.isLiquidityPoolToken() && (
                                <>
                                    <Spacer />
                                    <InfoMessage
                                        type="warning"
                                        containerStyle={styles.infoContainer}
                                        labelStyle={styles.infoText}
                                        label={
                                            !token.no_ripple
                                                ? Localize.t('asset.dangerousConfigurationDetected')
                                                : Localize.t('asset.restrictingConfigurationDetected')
                                        }
                                        actionButtonLabel={Localize.t('asset.moreInfoAndFix')}
                                        actionButtonIcon="IconInfo"
                                        isActionButtonLoading={isLoading}
                                        onActionButtonPress={this.showConfigurationAlert}
                                    />
                                </>
                            )}

                        <View style={styles.buttonRow}>
                            <RaisedButton
                                small
                                isDisabled={!this.canSend()}
                                containerStyle={styles.sendButton}
                                icon="IconV2Send"
                                iconSize={18}
                                iconStyle={styles.sendButtonIcon}
                                label={Localize.t('global.send')}
                                textStyle={styles.sendButtonText}
                                onPress={this.onSendPress}
                            />
                            <RaisedButton
                                small
                                isDisabled={!this.canExchange()}
                                containerStyle={styles.exchangeButton}
                                icon="IconV2Swap"
                                iconSize={17}
                                iconPosition="left"
                                iconStyle={styles.exchangeButtonIcon}
                                label={Localize.t('global.swap')}
                                textStyle={styles.exchangeButtonText}
                                onPress={this.onExchangePress}
                            />
                        </View>

                        {hasXAppIdentifier && (
                            <>
                                <View style={AppStyles.row}>
                                    <RaisedButton
                                        small
                                        containerStyle={styles.depositButton}
                                        icon="IconCoins"
                                        iconSize={22}
                                        iconStyle={styles.depositButtonIcon}
                                        label={`${Localize.t('global.add')} ${token.getFormattedCurrency()}`}
                                        textStyle={styles.depositButtonText}
                                        onPress={this.onDepositPress}
                                    />
                                </View>
                                <View style={AppStyles.row}>
                                    <RaisedButton
                                        small
                                        containerStyle={styles.withdrawButton}
                                        icon="IconWallet"
                                        iconPosition="left"
                                        iconSize={22}
                                        iconStyle={styles.withdrawButtonIcon}
                                        label={`${Localize.t('global.withdraw')} ${token.getFormattedCurrency()}`}
                                        textStyle={styles.withdrawButtonText}
                                        onPress={this.onWithdrawPress}
                                    />
                                </View>
                            </>
                        )}

                        <View style={styles.removeButtonContainer}>
                            <Button
                                roundedMini
                                testID="line-remove-button"
                                loadingIndicatorStyle="dark"
                                style={styles.removeButton}
                                isLoading={isRemoving}
                                isDisabled={!canRemove}
                                icon="IconTrash"
                                iconSize={18}
                                iconStyle={styles.removeButtonIcon}
                                label={Localize.t('asset.removeAsset')}
                                textStyle={styles.removeButtonText}
                                onPress={this.onRemovePress}
                            />
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default TokenSettingsOverlay;
