/**
 * Currency Settings Overlay
 */

import React, { Component } from 'react';
import { View, Animated, Text, Image, Alert, InteractionManager } from 'react-native';

import { TrustLineSchema, AccountSchema } from '@store/schemas/latest';
import { AccountRepository } from '@store/repositories';

import { TrustSet } from '@common/libs/ledger/transactions';
import Submitter from '@common/libs/ledger/submitter';
import Flag from '@common/libs/ledger/parser/common/flag';

import { NormalizeCurrencyCode } from '@common/libs/utils';

import { Prompt } from '@common/helpers/interface';
import { Navigator } from '@common/helpers/navigator';

import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, CustomButton } from '@components';

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
    }

    dismiss = () => {
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
        ]).start(() => {
            Navigator.dismissOverlay();
        });
    };

    removeTrustLine = async (privateKey: string) => {
        const { trustLine, account } = this.props;

        this.setState({
            isLoading: true,
        });

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

        const ledgerSubmitter = new Submitter(newTrustline.Json, privateKey);

        const submitResult = await ledgerSubmitter.submit();

        if (submitResult.success) {
            const verifyResult = await Submitter.verify(submitResult.transactionId);

            if (verifyResult.success) {
                InteractionManager.runAfterInteractions(() => {
                    Alert.alert(Localize.t('global.success'), Localize.t('currency.successRemoved'));
                });
            } else {
                InteractionManager.runAfterInteractions(() => {
                    Alert.alert(Localize.t('global.error'), Localize.t('currency.failedRemove'));
                });
            }
        } else {
            InteractionManager.runAfterInteractions(() => {
                Alert.alert(Localize.t('global.error'), Localize.t('currency.failedRemove'));
            });
        }

        this.dismiss();
    };

    showRemoveAlert = () => {
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

    render() {
        const { trustLine } = this.props;
        const { isLoading } = this.state;

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
                            <Text style={[AppStyles.p, AppStyles.bold]}>{Localize.t('global.currency')}</Text>
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
                                        {NormalizeCurrencyCode(trustLine.currency.currency)}
                                    </Text>
                                    <Text style={[styles.issuerLabel]}>
                                        {trustLine.currency.name
                                            ? trustLine.currency.name
                                            : trustLine.counterParty.name}
                                    </Text>
                                </View>
                            </View>
                            <View style={[AppStyles.flex4, AppStyles.row, AppStyles.centerAligned, AppStyles.flexEnd]}>
                                {trustLine.currency.avatar && (
                                    <Image style={styles.currencyAvatar} source={{ uri: trustLine.currency.avatar }} />
                                )}
                                <Text style={[AppStyles.pbold, AppStyles.monoBold]}>{trustLine.balance}</Text>
                            </View>
                        </View>

                        <Spacer />
                        <View style={[styles.buttonRow]}>
                            <CustomButton
                                isDisabled={trustLine.balance <= 0}
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
                            <CustomButton
                                style={styles.exchangeButton}
                                icon="IconCornerRightUp"
                                iconSize={20}
                                iconStyle={[styles.exchangeButtonIcon]}
                                iconPosition="right"
                                label={Localize.t('global.exchange')}
                                textStyle={[styles.exchangeButtonText]}
                                onPress={() => {
                                    this.dismiss();
                                    Navigator.push(AppScreens.Transaction.Exchange, {}, { trustLine });
                                }}
                            />
                        </View>

                        <Spacer size={20} />

                        <CustomButton
                            isLoading={isLoading}
                            isDisabled={trustLine.balance > 0}
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
