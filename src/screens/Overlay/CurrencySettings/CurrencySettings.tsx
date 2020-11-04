/**
 * Currency Settings Overlay
 */
import find from 'lodash/find';
import get from 'lodash/get';
import BigNumber from 'bignumber.js';

import React, { Component } from 'react';
import { View, Animated, Text, Image, Alert, InteractionManager } from 'react-native';

import { TrustLineSchema, AccountSchema } from '@store/schemas/latest';
import { AccountRepository } from '@store/repositories';

import { TrustSet, Payment } from '@common/libs/ledger/transactions';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';
import Flag from '@common/libs/ledger/parser/common/flag';

import { NormalizeCurrencyCode } from '@common/libs/utils';

import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

import LedgerService from '@services/LedgerService';

// components
import { Button, Spacer, RaisedButton } from '@components/General';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    trustLine: TrustLineSchema;
}

export interface State {
    isLoading: boolean;
    latestLineBalance: number;
    canRemove: boolean;
}
/* Component ==================================================================== */
class CurrencySettingsModal extends Component<Props, State> {
    static screenName = AppScreens.Overlay.CurrencySettings;
    private animatedColor: Animated.Value;
    private animatedOpacity: Animated.Value;

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
            isLoading: false,
            latestLineBalance: 0,
            canRemove: false,
        };

        this.animatedColor = new Animated.Value(0);
        this.animatedOpacity = new Animated.Value(0);
    }

    componentDidMount() {
        Animated.parallel([
            Animated.timing(this.animatedColor, {
                toValue: 150,
                duration: 350,
                useNativeDriver: false,
            }),
            Animated.timing(this.animatedOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start();

        this.getLatestLineBalance();
    }

    dismiss = () => {
        return new Promise((resolve) => {
            Animated.parallel([
                Animated.timing(this.animatedColor, {
                    toValue: 0,
                    duration: 350,
                    useNativeDriver: false,
                }),
                Animated.timing(this.animatedOpacity, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start(async () => {
                await Navigator.dismissOverlay();
                return resolve();
            });
        });
    };

    getLatestLineBalance = () => {
        const { account, trustLine } = this.props;

        // ignore obligation lines
        if (trustLine.obligation) return;

        LedgerService.getAccountLines(account.address)
            .then(async (accountLines: any) => {
                const { lines } = accountLines;

                const line = find(lines, { account: trustLine.currency.issuer, currency: trustLine.currency.currency });

                if (line) {
                    const lineBalance = new BigNumber(line.balance);

                    this.setState({
                        latestLineBalance: lineBalance.decimalPlaces(15).toNumber(),
                        canRemove: lineBalance.isLessThan(0.000001),
                    });
                }
            })
            .catch(() => {
                // ignore
            });
    };

    clearDustAmounts = (privateKey: string) => {
        /* eslint-disable-next-line */
        return new Promise(async (resolve, reject) => {
            const { latestLineBalance } = this.state;

            const { trustLine, account } = this.props;

            const payment = new Payment();

            payment.Destination = {
                address: account.address,
            };

            payment.Account = {
                address: account.address,
            };

            // @ts-ignore
            payment.Amount = '9999999999';
            payment.SendMax = {
                currency: trustLine.currency.currency,
                issuer: trustLine.currency.issuer,
                // @ts-ignore
                value: latestLineBalance,
            };

            payment.Flags = [txFlags.Payment.PartialPayment];

            // submit payment to the ledger
            await payment
                .submit(privateKey)
                .then(() => {
                    payment
                        .verify()
                        .then(() => {
                            return resolve();
                        })
                        .catch(() => {
                            return reject();
                        });
                })
                .catch(() => {
                    return reject();
                });
        });
    };

    checkForIssuerState = () => {
        const { trustLine } = this.props;

        return new Promise((resolve, reject) => {
            LedgerService.getAccountInfo(trustLine.currency.issuer)
                .then((issuerAccountInfo: any) => {
                    const issuerFlags = new Flag(
                        'Account',
                        get(issuerAccountInfo, ['account_data', 'Flags'], 0),
                    ).parse();

                    if (
                        trustLine.limit_peer > 0 ||
                        (!trustLine.no_ripple_peer && !issuerFlags.defaultRipple) ||
                        (trustLine.no_ripple_peer && issuerFlags.defaultRipple)
                    ) {
                        return reject();
                    }

                    return resolve();
                })
                .catch(() => {
                    return reject();
                });
        });
    };

    removeTrustLine = async (privateKey: string) => {
        const { trustLine, account } = this.props;
        const { latestLineBalance } = this.state;

        this.setState({
            isLoading: true,
        });

        // there is dust balance in the account
        if (latestLineBalance !== 0) {
            try {
                await this.clearDustAmounts(privateKey);
            } catch {
                InteractionManager.runAfterInteractions(() => {
                    Alert.alert(Localize.t('global.error'), Localize.t('asset.failedRemove'));
                });

                this.dismiss();
                return;
            }
        }

        // parse account flags
        const accountFlags = new Flag('Account', account.flags).parse();

        let transactionFlags = 2097152; // tfClearFreeze

        // If the (own) account DOES HAVE the defaultRipple flag,
        //  CLEAR the noRipple flag on the Trust Line, so set: tfClearNoRipple
        if (accountFlags.defaultRipple) {
            transactionFlags |= 262144;
        } else {
            // If the (own) account DOES NOT HAVE the defaultRipple flag SET the tfSetNoRipple flag
            transactionFlags |= 131072; // tfClearNoRipple
        }

        const newTrustline = new TrustSet({
            transaction: {
                Account: account.address,
                LimitAmount: {
                    currency: trustLine.currency.currency,
                    issuer: trustLine.currency.issuer,
                    value: 0,
                },
                Flags: transactionFlags,
            },
        });

        // sign and submit
        const submitResult = await newTrustline.submit(privateKey);

        if (submitResult.success) {
            const verifyResult = await newTrustline.verify();

            if (verifyResult.success) {
                InteractionManager.runAfterInteractions(() => {
                    Alert.alert(Localize.t('global.success'), Localize.t('asset.successRemoved'));
                });
            } else {
                InteractionManager.runAfterInteractions(() => {
                    Alert.alert(Localize.t('global.error'), Localize.t('asset.failedRemove'));
                });
            }
        } else {
            InteractionManager.runAfterInteractions(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('asset.failedRemove'));
            });
        }

        this.dismiss();
    };

    showRemoveAlert = async () => {
        this.setState({
            isLoading: true,
        });

        try {
            await this.checkForIssuerState().finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
        } catch {
            Alert.alert(Localize.t('global.error'), Localize.t('asset.unableToRemoveAssetNotInDefaultState'));
            return;
        }

        Prompt(
            Localize.t('global.warning'),
            Localize.t('account.removeTrustLineWarning'),
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
                                    this.removeTrustLine(privateKey);
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

    showExchangeScreen = () => {
        const { trustLine } = this.props;

        this.dismiss().then(() => {
            Navigator.push(AppScreens.Transaction.Exchange, {}, { trustLine });
        });
    };

    render() {
        const { trustLine } = this.props;
        const { isLoading, canRemove } = this.state;

        const interpolateColor = this.animatedColor.interpolate({
            inputRange: [0, 150],
            outputRange: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.8)'],
        });

        return (
            <Animated.View
                onResponderRelease={this.dismiss}
                onStartShouldSetResponder={() => true}
                style={[styles.container, { backgroundColor: interpolateColor }]}
            >
                <Animated.View style={[styles.visibleContent, { opacity: this.animatedOpacity }]}>
                    <View style={styles.headerContainer}>
                        <View style={[AppStyles.flex1, AppStyles.paddingLeftSml]}>
                            <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.asset')}</Text>
                        </View>
                        <View style={[AppStyles.row, AppStyles.flex1, AppStyles.flexEnd]}>
                            <Button label={Localize.t('global.cancel')} roundedSmall secondary onPress={this.dismiss} />
                        </View>
                    </View>
                    <View style={styles.contentContainer}>
                        <View style={[styles.currencyItem]}>
                            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                                <View style={[styles.brandAvatarContainer]}>
                                    <Image
                                        style={[styles.brandAvatar]}
                                        source={{ uri: trustLine.counterParty.avatar }}
                                    />
                                </View>
                                <View style={[AppStyles.column, AppStyles.centerContent]}>
                                    <Text style={[styles.currencyItemLabelSmall]}>
                                        {trustLine.currency.name
                                            ? trustLine.currency.name
                                            : NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                    <Text style={[styles.issuerLabel]}>
                                        {trustLine.counterParty.name}{' '}
                                        {trustLine.currency.name
                                            ? NormalizeCurrencyCode(trustLine.currency.currency)
                                            : ''}
                                    </Text>
                                </View>
                            </View>
                            <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                {trustLine.currency.avatar && (
                                    <Image style={styles.currencyAvatar} source={{ uri: trustLine.currency.avatar }} />
                                )}
                                <Text style={[AppStyles.pbold, AppStyles.monoBold]}>
                                    {Localize.formatNumber(trustLine.balance)}
                                </Text>
                            </View>
                        </View>

                        <Spacer />
                        <View style={[styles.buttonRow]}>
                            <RaisedButton
                                isDisabled={trustLine.balance <= 0 && trustLine.obligation !== true}
                                style={styles.sendButton}
                                icon="IconCornerLeftUp"
                                iconSize={20}
                                iconStyle={[styles.sendButtonIcon]}
                                label={Localize.t('global.send')}
                                textStyle={[styles.sendButtonText]}
                                onPress={() => {
                                    this.dismiss();
                                    Navigator.push(AppScreens.Transaction.Payment, {}, { currency: trustLine });
                                }}
                            />
                            <RaisedButton
                                isDisabled={trustLine.obligation}
                                style={styles.exchangeButton}
                                icon="IconCornerRightUp"
                                iconSize={20}
                                iconStyle={[styles.exchangeButtonIcon]}
                                iconPosition="right"
                                label={Localize.t('global.exchange')}
                                textStyle={[styles.exchangeButtonText]}
                                onPress={this.showExchangeScreen}
                            />
                        </View>

                        <Spacer size={20} />

                        <RaisedButton
                            isLoading={isLoading}
                            isDisabled={!canRemove}
                            icon="IconTrash"
                            iconSize={20}
                            iconStyle={[styles.removeButtonIcon]}
                            label={Localize.t('global.remove')}
                            textStyle={[styles.removeButtonText]}
                            onPress={this.showRemoveAlert}
                        />
                    </View>
                </Animated.View>
            </Animated.View>
        );
    }
}

/* Export Component ==================================================================== */
export default CurrencySettingsModal;
