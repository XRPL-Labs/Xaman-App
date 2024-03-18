/**
 * Token Settings Overlay
 */
import { get, has } from 'lodash';
import BigNumber from 'bignumber.js';

import React, { Component } from 'react';
import { Alert, Animated, Image, InteractionManager, Text, View } from 'react-native';
import { OptionsModalPresentationStyle, OptionsModalTransitionStyle } from 'react-native-navigation';

import { TrustLineRepository } from '@store/repositories';
import { AccountModel, TrustLineModel } from '@store/models';

import { Payload, XAppOrigin } from '@common/libs/payload';

import { Payment, TrustSet } from '@common/libs/ledger/transactions';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { Prompt, Toast } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';
import { Clipboard } from '@common/helpers/clipboard';

import { AppScreens } from '@common/constants';

import LedgerService from '@services/LedgerService';

// components
import {
    AmountText,
    Button,
    Icon,
    InfoMessage,
    RaisedButton,
    Spacer,
    TokenAvatar,
    TouchableDebounce,
} from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
    trustLine: TrustLineModel;
}

export interface State {
    isFavorite: boolean;
    isRemoving: boolean;
    isLoading: boolean;
    isReviewScreenVisible: boolean;
    hasXAppIdentifier: boolean;
    latestLineBalance: number;
    canRemove: boolean;
}
/* Component ==================================================================== */
class TokenSettingsModal extends Component<Props, State> {
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
            isFavorite: props.trustLine.favorite,
            hasXAppIdentifier: !!props.trustLine.currency.xapp_identifier,
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

    getLatestLineBalance = (): Promise<void> => {
        const { account, trustLine } = this.props;

        // ignore obligation lines
        if (trustLine.obligation) return Promise.resolve();

        return new Promise((resolve) => {
            LedgerService.getFilteredAccountLine(account.address, trustLine.currency)
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
        const { trustLine, account } = this.props;

        try {
            this.setState({
                isRemoving: true,
            });

            const payment = new Payment({
                TransactionType: TransactionTypes.Payment,
                Account: account.address,
                Destination: trustLine.currency.issuer,
                DestinationTag: 0,
                Amount: {
                    currency: trustLine.currency.currency,
                    issuer: trustLine.currency.issuer,
                    value: String(latestLineBalance),
                },
            });

            // add PartialPayment flag if issuer have transferFee
            const issuerAccountInfo = await LedgerService.getAccountInfo(trustLine.currency.issuer);
            // eslint-disable-next-line max-len
            if (has(issuerAccountInfo, ['account_data', 'TransferRate'])) {
                payment.Flags = [txFlags.Payment.PartialPayment];
            }

            const payload = Payload.build(payment.Json);

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
                this.setState(
                    {
                        isReviewScreenVisible: true,
                    },
                    () => {
                        Navigator.showModal(
                            AppScreens.Modal.ReviewTransaction,
                            {
                                payload,
                                onResolve: this.onClearDustResolve,
                                onClose: this.onReviewScreenClose,
                            },
                            { modalPresentationStyle: 'fullScreen' },
                        );
                    },
                );
            });
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('asset.failedRemove'));
        }
    };

    onClearDustResolve = (transaction: Payment) => {
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
        const { trustLine, account } = this.props;
        const { latestLineBalance } = this.state;

        try {
            // there is dust balance in the account
            if (latestLineBalance !== 0) {
                Prompt(
                    Localize.t('global.warning'),
                    Localize.t('asset.trustLineDustRemoveWarning', {
                        balance: new BigNumber(latestLineBalance).toFixed(),
                        currency: NormalizeCurrencyCode(trustLine.currency.currency),
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
                    currency: trustLine.currency.currency,
                    issuer: trustLine.currency.issuer,
                    value: 0,
                },
                Flags: transactionFlags,
            });

            const payload = Payload.build(trustSet.Json);

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
                this.setState(
                    {
                        isReviewScreenVisible: true,
                    },
                    () => {
                        Navigator.showModal(
                            AppScreens.Modal.ReviewTransaction,
                            {
                                payload,
                                onResolve: this.onRemoveLineResolve,
                                onClose: this.onReviewScreenClose,
                            },
                            { modalPresentationStyle: 'overCurrentContext' },
                        );
                    },
                );
            });
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

    onRemoveLineResolve = (transaction: TrustSet) => {
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
        const { trustLine } = this.props;

        this.dismiss().then(() => {
            Navigator.push(AppScreens.Transaction.Payment, { currency: trustLine });
        });
    };

    onExchangePress = () => {
        const { account, trustLine } = this.props;

        this.dismiss().then(() => {
            Navigator.push(AppScreens.Transaction.Exchange, { account, trustLine });
        });
    };

    onDepositPress = async () => {
        const { trustLine } = this.props;

        this.dismiss().then(() => {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier: trustLine.currency.xapp_identifier,
                    params: {
                        issuer: trustLine.currency.issuer,
                        asset: trustLine.currency.currency,
                        action: 'DEPOSIT',
                    },
                    origin: XAppOrigin.XUMM,
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
            );
        });
    };

    onWithdrawPress = async () => {
        const { trustLine } = this.props;

        this.dismiss().then(() => {
            Navigator.showModal(
                AppScreens.Modal.XAppBrowser,
                {
                    identifier: trustLine.currency.xapp_identifier,
                    params: {
                        issuer: trustLine.currency.issuer,
                        asset: trustLine.currency.currency,
                        action: 'WITHDRAW',
                    },
                    origin: XAppOrigin.XUMM,
                },
                {
                    modalTransitionStyle: OptionsModalTransitionStyle.coverVertical,
                    modalPresentationStyle: OptionsModalPresentationStyle.fullScreen,
                },
            );
        });
    };

    onFavoritePress = () => {
        const { trustLine } = this.props;

        this.setState({
            isFavorite: !trustLine.favorite,
        });

        // update the trustline
        TrustLineRepository.update({
            id: trustLine.id,
            favorite: !trustLine.favorite,
        });
    };

    disableRippling = async () => {
        const { account, trustLine } = this.props;

        const trustSet = new TrustSet({
            TransactionType: TransactionTypes.TrustSet,
            Account: account.address,
            LimitAmount: {
                currency: trustLine.currency.currency,
                issuer: trustLine.currency.issuer,
                value: trustLine.limit,
            },
            Flags: 131072, // tfSetNoRipple
        });

        const payload = Payload.build(trustSet.Json);

        await this.dismiss();

        Navigator.showModal(
            AppScreens.Modal.ReviewTransaction,
            {
                payload,
            },
            { modalPresentationStyle: 'fullScreen' },
        );
    };

    updateLineLimit = async () => {
        const { account, trustLine } = this.props;

        this.setState({
            isLoading: true,
        });
        // set the default line limit
        let lineLimit = '1000000000';

        try {
            // set the trustline limit by gateway balance if it's more than our default value
            const resp = await LedgerService.getGatewayBalances(trustLine.currency.issuer);
            const gatewayBalances = get(resp, ['obligations', trustLine.currency.currency]);

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

        const trustSet = new TrustSet({
            TransactionType: TransactionTypes.TrustSet,
            Account: account.address,
            LimitAmount: {
                currency: trustLine.currency.currency,
                issuer: trustLine.currency.issuer,
                value: lineLimit,
            },
            Flags: 131072, // tfSetNoRipple
        });

        const payload = Payload.build(trustSet.Json);

        await this.dismiss();

        Navigator.showModal(
            AppScreens.Modal.ReviewTransaction,
            {
                payload,
            },
            { modalPresentationStyle: 'fullScreen' },
        );
    };

    showConfigurationAlert = () => {
        const { trustLine } = this.props;

        let explanation;
        let fixMethod;

        if (trustLine.no_ripple === false) {
            explanation = Localize.t('asset.ripplingMisconfigurationWarning', {
                token: NormalizeCurrencyCode(trustLine.currency.currency),
            });
            fixMethod = this.disableRippling;
        } else if (Number(trustLine.limit) === 0) {
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

    copyIssuerAddress = () => {
        const { trustLine } = this.props;

        Clipboard.setString(trustLine.currency.issuer);
        Toast(Localize.t('asset.issuerAddressCopiedToClipboard'));
    };

    canSend = () => {
        const { trustLine } = this.props;
        return Number(trustLine.balance) >= 0.00000001 || trustLine.obligation;
    };

    canExchange = () => {
        const { trustLine } = this.props;
        return !trustLine.obligation;
    };

    render() {
        const { trustLine } = this.props;
        const { isFavorite, isReviewScreenVisible, isRemoving, isLoading, canRemove, hasXAppIdentifier } = this.state;

        if (isReviewScreenVisible) {
            return null;
        }

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View
                needsOffscreenAlphaCompositing
                testID="currency-settings-overlay"
                style={[styles.container, { opacity: this.animatedOpacity, backgroundColor: interpolateColor }]}
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
                        <View style={styles.currencyItem}>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <View style={[styles.brandAvatarContainer]}>
                                    <TokenAvatar token={trustLine} border size={35} />
                                </View>
                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text style={styles.currencyItemLabelSmall}>
                                        {trustLine.currency.name || NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                    <TouchableDebounce
                                        onPress={this.copyIssuerAddress}
                                        style={AppStyles.row}
                                        activeOpacity={1}
                                    >
                                        <Text style={styles.issuerLabel}>
                                            {trustLine.counterParty.name}{' '}
                                            {trustLine.currency.name
                                                ? NormalizeCurrencyCode(trustLine.currency.currency)
                                                : ''}
                                        </Text>
                                        <Icon style={styles.copyIcon} name="IconCopy" size={15} />
                                    </TouchableDebounce>
                                </View>
                            </View>
                            <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                {!!trustLine.currency.avatar && (
                                    <Image style={styles.currencyAvatar} source={{ uri: trustLine.currency.avatar }} />
                                )}
                                <AmountText value={trustLine.balance} style={[AppStyles.pbold, AppStyles.monoBold]} />
                            </View>
                        </View>

                        {(trustLine.no_ripple === false || Number(trustLine.limit) === 0) &&
                            !trustLine.obligation &&
                            !trustLine.isLPToken() && (
                                <>
                                    <Spacer />
                                    <InfoMessage
                                        type="warning"
                                        containerStyle={styles.infoContainer}
                                        labelStyle={styles.infoText}
                                        label={
                                            !trustLine.no_ripple
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
                                icon="IconCornerLeftUp"
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
                                icon="IconSwitchAccount"
                                iconSize={17}
                                iconPosition="left"
                                iconStyle={styles.exchangeButtonIcon}
                                label={Localize.t('global.exchange')}
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
                                        label={`${Localize.t('global.add')} ${
                                            trustLine.currency.name ||
                                            NormalizeCurrencyCode(trustLine.currency.currency)
                                        }`}
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
                                        label={`${Localize.t('global.withdraw')} ${
                                            trustLine.currency.name ||
                                            NormalizeCurrencyCode(trustLine.currency.currency)
                                        }`}
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
export default TokenSettingsModal;
