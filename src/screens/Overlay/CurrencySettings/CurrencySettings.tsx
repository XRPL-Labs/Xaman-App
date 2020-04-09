/**
 * Custom Action Sheet Overlay
 */

import React, { Component } from 'react';
import { View, Animated, Text, Image, Alert, InteractionManager } from 'react-native';

import { TrustLineSchema } from '@store/schemas/latest';
import { AccountRepository } from '@store/repositories';

import { TrustSet } from '@common/libs/ledger/transactions';
import Submitter from '@common/libs/ledger/submitter';

import { NormalizeCurrencyCode } from '@common/libs/utils';
import { Navigator, Prompt } from '@common/helpers';
import { AppScreens } from '@common/constants';

// components
import { Button, Spacer, CustomButton } from '@components';

import Localize from '@locale';

// style
import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
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
        const { trustLine } = this.props;

        this.setState({
            isLoading: true,
        });

        const newTrustline = new TrustSet();

        // @ts-ignore
        newTrustline.Account = { address: trustLine.linkingObjects('Account', 'lines')[0].address };
        newTrustline.Flags = [131072]; // tfSetNoRipple
        newTrustline.Currency = trustLine.currency.currency;
        newTrustline.Issuer = trustLine.currency.issuer;
        // this will remove trust line
        newTrustline.Limit = 0;

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
