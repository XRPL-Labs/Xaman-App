import React, { Component } from 'react';
import { Image, InteractionManager, View } from 'react-native';
import { isEmpty, isEqual } from 'lodash';

import { ExplainerFactory } from '@common/libs/ledger/factory';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { Transactions } from '@common/libs/ledger/transactions/types';
import { OfferStatus, OperationActions } from '@common/libs/ledger/parser/types';

import { AccountModel } from '@store/models';

import { Navigator } from '@common/helpers/navigator';
import { getAccountName } from '@common/helpers/resolver';
import { Images } from '@common/helpers/images';

import { NormalizeAmount, NormalizeCurrencyCode } from '@common/utils/amount';
import { Truncate } from '@common/utils/string';

import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { AmountText, Avatar, Icon, TextPlaceholder, TouchableDebounce } from '@components/General';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountModel;
    item: Transactions;
    timestamp?: number;
}

export interface State {
    isLoading: boolean;
    recipientDetails: {
        address: string;
        tag?: number;
        name?: string;
        kycApproved?: boolean;
    };
    label: string;
}

/* Component ==================================================================== */
class TransactionItem extends Component<Props, State> {
    static Height = AppSizes.heightPercentageToDP(7.5);

    private mounted = false;

    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            recipientDetails: undefined,
            label: undefined,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { timestamp } = this.props;
        return !isEqual(nextState, this.state) || !isEqual(nextProps.timestamp, timestamp);
    }

    componentDidMount() {
        // track mounted
        this.mounted = true;

        // fetch recipient details
        InteractionManager.runAfterInteractions(this.setDetails);
    }

    componentDidUpdate(prevProps: Props) {
        const { timestamp } = this.props;

        // force the lookup if timestamp changed
        if (timestamp !== prevProps.timestamp) {
            InteractionManager.runAfterInteractions(this.setDetails);
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    setDetails = async () => {
        const { isLoading } = this.state;
        const { item, account } = this.props;

        // set is loading flag if not true
        if (!isLoading) {
            this.setState({
                isLoading: true,
            });
        }

        // fetch explainer
        const txExplainer = ExplainerFactory.fromType(item.Type);

        // get label
        const transactionLabel = txExplainer.getLabel(item, account);

        // get recipient
        let recipient = txExplainer.getRecipient(item, account);

        // if there is no recipient then load account address
        if (isEmpty(recipient)) {
            recipient = {
                address: account.address,
            };
        }

        try {
            // getRecipient
            const resp = await getAccountName(recipient.address, recipient.tag);
            if (!isEmpty(resp) && this.mounted) {
                this.setState({
                    label: transactionLabel,
                    recipientDetails: {
                        ...recipient,
                        name: resp.name,
                        kycApproved: resp.kycApproved,
                    },
                    isLoading: false,
                });
            }
        } catch (error) {
            if (this.mounted) {
                this.setState({
                    label: transactionLabel,
                    recipientDetails: { ...recipient },
                    isLoading: false,
                });
            }
        }
    };

    onPress = () => {
        const { item, account } = this.props;
        Navigator.push(AppScreens.Transaction.Details, { tx: item, account });
    };

    getIcon = () => {
        const { recipientDetails, isLoading } = this.state;

        return (
            <View style={styles.iconContainer}>
                <Avatar
                    badge={recipientDetails?.kycApproved ? 'IconCheckXaman' : undefined}
                    border
                    source={{ uri: `https://xumm.app/avatar/${recipientDetails?.address}_180_50.png` }}
                    isLoading={isLoading}
                />
            </View>
        );
    };

    getDescription = () => {
        const { recipientDetails } = this.state;
        const { item, account } = this.props;

        if (item.Type === TransactionTypes.OfferCreate) {
            if ([OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].indexOf(item.GetOfferStatus(account.address)) > -1) {
                const takerGot = item.TakerGot(account.address);
                const takerPaid = item.TakerPaid(account.address);

                return `${Localize.formatNumber(NormalizeAmount(takerGot.value))} ${NormalizeCurrencyCode(
                    takerGot.currency,
                )}/${NormalizeCurrencyCode(takerPaid.currency)}`;
            }
            return `${Localize.formatNumber(NormalizeAmount(item.TakerGets.value))} ${NormalizeCurrencyCode(
                item.TakerGets.currency,
            )}/${NormalizeCurrencyCode(item.TakerPays.currency)}`;
        }

        if (item.Type === TransactionTypes.Payment) {
            if ([item.Account.address, item.Destination?.address].indexOf(account.address) === -1) {
                const balanceChanges = item.BalanceChange(account.address);

                if (balanceChanges?.sent && balanceChanges?.received) {
                    return `${Localize.formatNumber(Number(balanceChanges.sent.value))} ${NormalizeCurrencyCode(
                        balanceChanges.sent.currency,
                    )}/${NormalizeCurrencyCode(balanceChanges.received.currency)}`;
                }
            }
        }

        if (recipientDetails?.name) return recipientDetails.name;
        if (recipientDetails?.address) return Truncate(recipientDetails.address, 16);

        return Localize.t('global.unknown');
    };

    renderMemoIcon = () => {
        const { item } = this.props;

        // if memo contain xApp identifier then show xApp Icon
        if (item.getXappIdentifier()) {
            return <Image source={Images.IconXApp} style={styles.xAppsIcon} />;
        }

        if (item.Memos) {
            return <Icon name="IconFileText" style={[AppStyles.imgColorGrey, AppStyles.paddingLeftSml]} size={12} />;
        }

        return null;
    };

    renderReserveIcon = () => {
        const { item, account } = this.props;

        let changes;

        if (typeof item.OwnerCountChange === 'function') {
            changes = item.OwnerCountChange(account.address);
        }

        if (changes) {
            return (
                <Icon
                    name={changes.action === OperationActions.INC ? 'IconLock' : 'IconUnlock'}
                    style={[AppStyles.imgColorGrey, AppStyles.paddingLeftSml]}
                    size={12}
                />
            );
        }

        return null;
    };

    renderRightPanel = () => {
        const { isLoading } = this.state;
        const { item, account } = this.props;

        if (isLoading) {
            return null;
        }

        let incoming = item.Account?.address !== account.address;

        if (item.Type === TransactionTypes.Payment) {
            const balanceChanges = item.BalanceChange(account.address);
            const amount = item.DeliveredAmount || item.Amount;

            if ([item.Account.address, item.Destination?.address].indexOf(account.address) === -1) {
                // regular key
                if (!balanceChanges?.received && !balanceChanges?.sent) {
                    return (
                        <AmountText
                            value={amount.value}
                            currency={amount.currency}
                            style={[styles.amount, styles.naturalColor]}
                            currencyStyle={styles.currency}
                            valueContainerStyle={styles.amountValueContainer}
                            truncateCurrency
                        />
                    );
                }
                if (balanceChanges?.received) {
                    return (
                        <AmountText
                            value={balanceChanges.received?.value}
                            currency={balanceChanges.received?.currency}
                            style={styles.amount}
                            currencyStyle={styles.currency}
                            valueContainerStyle={styles.amountValueContainer}
                            truncateCurrency
                        />
                    );
                }
            }

            // path payment to self
            if (item.Account.address === account.address && item.Destination.address === account.address) {
                return (
                    <AmountText
                        value={amount.value}
                        currency={amount.currency}
                        style={[styles.amount]}
                        currencyStyle={styles.currency}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                );
            }

            return (
                <AmountText
                    value={amount.value}
                    currency={amount.currency}
                    prefix={!incoming && '-'}
                    style={[styles.amount, !incoming && styles.outgoingColor]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        if (item.Type === TransactionTypes.AccountDelete) {
            return (
                <AmountText
                    value={item.Amount.value}
                    currency={item.Amount.currency}
                    prefix={!incoming && '-'}
                    style={[styles.amount, !incoming && styles.outgoingColor]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        if (item.Type === TransactionTypes.EscrowCreate) {
            return (
                <AmountText
                    value={item.Amount.value}
                    currency={item.Amount.currency}
                    prefix={item.Account.address === account.address && '-'}
                    style={[
                        styles.amount,
                        item.Account.address === account.address ? styles.orangeColor : styles.naturalColor,
                    ]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        if (item.Type === TransactionTypes.EscrowFinish) {
            return (
                <AmountText
                    value={item.Amount.value}
                    currency={item.Amount.currency}
                    prefix={item.Owner === account.address && '-'}
                    style={[
                        styles.amount,
                        item.Destination.address !== account.address &&
                            item.Owner !== account.address &&
                            styles.naturalColor,
                        item.Owner === account.address && styles.outgoingColor,
                    ]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        if (item.Type === TransactionTypes.CheckCreate) {
            return (
                <AmountText
                    value={item.SendMax.value}
                    currency={item.SendMax.currency}
                    style={[styles.amount, styles.naturalColor]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        if (item.Type === TransactionTypes.CheckCash) {
            const amount = item.Amount || item.DeliverMin;
            incoming = item.Account.address === account.address;
            return (
                <AmountText
                    value={amount.value}
                    currency={amount.currency}
                    prefix={!incoming && '-'}
                    style={[styles.amount, !incoming && styles.outgoingColor]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        if (item.Type === TransactionTypes.OfferCreate) {
            if ([OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].indexOf(item.GetOfferStatus(account.address)) > -1) {
                const takerPaid = item.TakerPaid(account.address);

                return (
                    <AmountText
                        value={takerPaid.value}
                        currency={takerPaid.currency}
                        style={[styles.amount]}
                        currencyStyle={styles.currency}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                );
            }
            return (
                <AmountText
                    value={item.TakerPays.value}
                    currency={item.TakerPays.currency}
                    style={[styles.amount, styles.naturalColor]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        if (['PaymentChannelClaim', 'PaymentChannelFund', 'PaymentChannelCreate'].includes(item.Type)) {
            const balanceChanges = item.BalanceChange(account.address);

            if (balanceChanges && (balanceChanges.received || balanceChanges.sent)) {
                const amount = balanceChanges?.received || balanceChanges?.sent;

                return (
                    <AmountText
                        value={amount.value}
                        currency={amount.currency}
                        prefix={!!balanceChanges.sent && !amount.value.startsWith('-') && '-'}
                        style={[styles.amount, !!balanceChanges.sent && styles.outgoingColor]}
                        currencyStyle={styles.currency}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                );
            }
        }

        if (item.Type === TransactionTypes.NFTokenAcceptOffer) {
            const balanceChanges = item.BalanceChange(account.address);
            if (balanceChanges && (balanceChanges.received || balanceChanges.sent)) {
                const amount = balanceChanges?.received || balanceChanges?.sent;

                return (
                    <AmountText
                        value={amount.value}
                        currency={amount.currency}
                        prefix={!!balanceChanges.sent && '-'}
                        style={[styles.amount, !!balanceChanges.sent && styles.outgoingColor]}
                        currencyStyle={styles.currency}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                );
            }
        }

        if (item.Type === TransactionTypes.GenesisMint) {
            const balanceChanges = item.BalanceChange(account.address);
            if (balanceChanges && balanceChanges.received) {
                return (
                    <AmountText
                        value={balanceChanges.received.value}
                        currency={balanceChanges.received.currency}
                        style={styles.amount}
                        currencyStyle={styles.currency}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                );
            }
        }

        if (item.Type === TransactionTypes.EnableAmendment) {
            const balanceChanges = item.BalanceChange(account.address);
            if (balanceChanges && balanceChanges.received) {
                return (
                    <AmountText
                        value={balanceChanges.received.value}
                        currency={balanceChanges.received.currency}
                        style={styles.amount}
                        currencyStyle={styles.currency}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                );
            }
        }

        if (item.Type === TransactionTypes.Import) {
            const balanceChanges = item.BalanceChange(account.address);
            if (balanceChanges && (balanceChanges.received || balanceChanges.sent)) {
                const amount = balanceChanges?.received || balanceChanges?.sent;
                return (
                    <AmountText
                        value={amount.value}
                        currency={amount.currency}
                        prefix={!!balanceChanges.sent && !amount.value.startsWith('-') && '-'}
                        style={[styles.amount, !!balanceChanges.sent && styles.outgoingColor]}
                        currencyStyle={styles.currency}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                );
            }
        }

        if (item.Type === TransactionTypes.ClaimReward) {
            const balanceChanges = item.BalanceChange(account.address);
            if (balanceChanges && (balanceChanges.received || balanceChanges.sent)) {
                const amount = balanceChanges?.received || balanceChanges?.sent;
                return (
                    <AmountText
                        value={amount.value}
                        currency={amount.currency}
                        prefix={!!balanceChanges.sent && !amount.value.startsWith('-') && '-'}
                        style={[styles.amount, !!balanceChanges.sent && styles.outgoingColor]}
                        currencyStyle={styles.currency}
                        valueContainerStyle={styles.amountValueContainer}
                        truncateCurrency
                    />
                );
            }
        }

        return null;
    };

    renderLabel = () => {
        const { label, isLoading } = this.state;

        return (
            <TextPlaceholder style={styles.description} numberOfLines={1} isLoading={isLoading}>
                {label}
            </TextPlaceholder>
        );
    };

    render() {
        const { isLoading } = this.state;

        return (
            <TouchableDebounce
                onPress={this.onPress}
                activeOpacity={0.6}
                style={[styles.container, { height: TransactionItem.Height }]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>{this.getIcon()}</View>
                <View style={[AppStyles.flex3, AppStyles.centerContent]}>
                    <TextPlaceholder style={styles.label} numberOfLines={1} isLoading={isLoading}>
                        {this.getDescription()}
                    </TextPlaceholder>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        {this.renderLabel()}
                        {this.renderMemoIcon()}
                        {this.renderReserveIcon()}
                    </View>
                </View>
                <View style={[AppStyles.flex2, AppStyles.rightAligned, AppStyles.centerContent]}>
                    {this.renderRightPanel()}
                </View>
            </TouchableDebounce>
        );
    }
}

export default TransactionItem;
