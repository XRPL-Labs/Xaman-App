import React, { Component } from 'react';
import { Image, InteractionManager, Text, View } from 'react-native';
import { isEmpty, isEqual } from 'lodash';

import { TransactionTypes } from '@common/libs/ledger/types';
import { Transactions } from '@common/libs/ledger/transactions/types';
import { OfferStatus } from '@common/libs/ledger/parser/types';

import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';
import { getAccountName } from '@common/helpers/resolver';
import { Images } from '@common/helpers/images';

import { NormalizeAmount, NormalizeCurrencyCode } from '@common/utils/amount';
import { Truncate } from '@common/utils/string';

import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { AmountText, Avatar, Icon, TouchableDebounce } from '@components/General';

import { AppSizes, AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    item: Transactions;
    timestamp?: number;
}

export interface State {
    name: string;
    address: string;
    kycApproved: boolean;
    tag: number;
}

/* Component ==================================================================== */
class TransactionItem extends Component<Props, State> {
    static Height = AppSizes.heightPercentageToDP(7.5);

    private mounted: boolean;

    constructor(props: Props) {
        super(props);

        this.state = {
            name: undefined,
            address: undefined,
            tag: undefined,
            kycApproved: false,
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
        InteractionManager.runAfterInteractions(this.fetchRecipientDetails);
    }

    componentDidUpdate(prevProps: Props) {
        const { timestamp } = this.props;

        // force the lookup if timestamp changed
        if (timestamp !== prevProps.timestamp) {
            this.fetchRecipientDetails();
        }
    }

    componentWillUnmount() {
        // track mounted
        this.mounted = false;
    }

    fetchRecipientDetails = () => {
        const { item, account } = this.props;

        let address = '';
        let tag = undefined as number;

        switch (item.Type) {
            case TransactionTypes.Payment:
                if (item.Account?.address !== account.address) {
                    address = item.Account.address;
                } else {
                    address = item.Destination.address;
                    tag = item.Destination.tag;
                }
                break;

            case TransactionTypes.CheckCreate:
                if (item.Account?.address !== account.address) {
                    address = item.Account.address;
                } else {
                    address = item.Destination.address;
                    tag = item.Destination.tag;
                }
                break;
            case TransactionTypes.TrustSet:
                address = item.Issuer;
                break;
            case TransactionTypes.EscrowCreate:
                address = item.Account.address;
                tag = item.Account.tag;
                break;
            case TransactionTypes.EscrowCancel:
                address = item.Owner;
                break;
            case TransactionTypes.EscrowFinish:
                address = item.Destination.address;
                tag = item.Destination.tag;
                break;
            case TransactionTypes.DepositPreauth:
                address = item.Authorize || item.Unauthorize;
                break;

            case TransactionTypes.PaymentChannelCreate:
                if (item.Account?.address !== account.address) {
                    address = item.Account.address;
                } else {
                    address = item.Destination.address;
                    tag = item.Destination.tag;
                }
                break;

            case TransactionTypes.NFTokenAcceptOffer:
                if (item.Account?.address === account.address) {
                    if (item.Offer) {
                        address = item.Offer.Owner;
                    }
                } else {
                    address = item.Account.address;
                }
                break;
            case TransactionTypes.AccountDelete:
            case TransactionTypes.AccountSet:
            case TransactionTypes.SignerListSet:
            case TransactionTypes.SetRegularKey:
            case TransactionTypes.OfferCancel:
            case TransactionTypes.OfferCreate:
            case TransactionTypes.CheckCash:
            case TransactionTypes.CheckCancel:
            case TransactionTypes.TicketCreate:
            case TransactionTypes.PaymentChannelFund:
            case TransactionTypes.PaymentChannelClaim:
            case TransactionTypes.NFTokenMint:
            case TransactionTypes.NFTokenBurn:
            case TransactionTypes.NFTokenCreateOffer:
            case TransactionTypes.NFTokenCancelOffer:
                address = item.Account.address;
                break;
            default:
                break;
        }

        getAccountName(address, tag)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    if (this.mounted) {
                        this.setState({
                            address,
                            tag,
                            name: res.name,
                            kycApproved: res.kycApproved,
                        });
                    }
                }
            })
            .catch(() => {
                if (this.mounted) {
                    this.setState({
                        address,
                        tag,
                    });
                }
            });
    };

    onPress = () => {
        const { item, account } = this.props;
        Navigator.push(AppScreens.Transaction.Details, { tx: item, account });
    };

    getIcon = () => {
        const { address, kycApproved } = this.state;
        const { item } = this.props;

        if (address) {
            return (
                <View style={styles.iconContainer}>
                    <Avatar
                        badge={kycApproved ? 'IconCheckXumm' : undefined}
                        border
                        source={{ uri: `https://xumm.app/avatar/${address}_180_50.png` }}
                    />
                </View>
            );
        }
        let iconName = '' as any;
        let iconColor;

        switch (item.Type) {
            case TransactionTypes.OfferCreate:
            case TransactionTypes.Payment:
                iconName = 'IconSwitchAccount';
                break;
            default:
                iconName = 'IconAccount';
                break;
        }

        return (
            <View style={styles.iconContainer}>
                <Icon size={20} style={[styles.icon, iconColor]} name={iconName} />
            </View>
        );
    };

    getLabel = () => {
        const { name, address } = this.state;
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

        if (name) return name;
        if (address) return Truncate(address, 16);

        return Localize.t('global.loading');
    };

    getDescription = () => {
        const { item, account } = this.props;

        switch (item.Type) {
            case TransactionTypes.Payment:
                if ([item.Account.address, item.Destination?.address].indexOf(account.address) === -1) {
                    const balanceChanges = item.BalanceChange(account.address);
                    if (balanceChanges?.sent && balanceChanges?.received) {
                        return Localize.t('events.exchangedAssets');
                    }
                    return Localize.t('global.payment');
                }
                if (item.Destination.address === account.address) {
                    return Localize.t('events.paymentReceived');
                }
                return Localize.t('events.paymentSent');
            case TransactionTypes.TrustSet: {
                // incoming TrustLine
                if (item.Account.address !== account.address) {
                    if (item.Limit === 0) {
                        return Localize.t('events.incomingTrustLineRemoved');
                    }
                    return Localize.t('events.incomingTrustLineAdded');
                }
                const ownerCountChange = item.OwnerCountChange(account.address);
                if (ownerCountChange) {
                    if (ownerCountChange.action === 'INC') {
                        return Localize.t('events.addedATrustLine');
                    }
                    return Localize.t('events.removedATrustLine');
                }
                return Localize.t('events.updatedATrustLine');
            }
            case TransactionTypes.EscrowCreate:
                return Localize.t('events.createEscrow');
            case TransactionTypes.EscrowFinish:
                return Localize.t('events.finishEscrow');
            case TransactionTypes.EscrowCancel:
                return Localize.t('events.cancelEscrow');
            case TransactionTypes.AccountSet:
                if (item.isNoOperation() && item.isCancelTicket()) {
                    return Localize.t('events.cancelTicket');
                }
                return Localize.t('events.accountSettings');
            case TransactionTypes.SignerListSet:
                return Localize.t('events.setSignerList');
            case TransactionTypes.OfferCreate:
                if (
                    [OfferStatus.FILLED, OfferStatus.PARTIALLY_FILLED].indexOf(item.GetOfferStatus(account.address)) >
                    -1
                ) {
                    return Localize.t('events.exchangedAssets');
                }
                return Localize.t('events.createOffer');
            case TransactionTypes.OfferCancel:
                return Localize.t('events.cancelOffer');
            case TransactionTypes.AccountDelete:
                return Localize.t('events.deleteAccount');
            case TransactionTypes.SetRegularKey:
                if (item.RegularKey) {
                    return Localize.t('events.setRegularKey');
                }
                return Localize.t('events.removeRegularKey');
            case TransactionTypes.DepositPreauth:
                if (item.Authorize) {
                    return Localize.t('events.authorizeDeposit');
                }
                return Localize.t('events.unauthorizeDeposit');
            case TransactionTypes.CheckCreate:
                return Localize.t('events.createCheck');
            case TransactionTypes.CheckCash:
                return Localize.t('events.cashCheck');
            case TransactionTypes.CheckCancel:
                return Localize.t('events.cancelCheck');
            case TransactionTypes.TicketCreate:
                return Localize.t('events.createTicket');
            case TransactionTypes.PaymentChannelCreate:
                return Localize.t('events.createPaymentChannel');
            case TransactionTypes.PaymentChannelClaim:
                return Localize.t('events.claimPaymentChannel');
            case TransactionTypes.PaymentChannelFund:
                return Localize.t('events.fundPaymentChannel');
            case TransactionTypes.NFTokenMint:
                return Localize.t('events.mintNFT');
            case TransactionTypes.NFTokenBurn:
                return Localize.t('events.burnNFT');
            case TransactionTypes.NFTokenCreateOffer:
                return Localize.t('events.createNFTOffer');
            case TransactionTypes.NFTokenCancelOffer:
                return Localize.t('events.cancelNFTOffer');
            case TransactionTypes.NFTokenAcceptOffer:
                return Localize.t('events.acceptNFTOffer');
            default:
                return 'Unsupported transaction';
        }
    };

    renderMemoIcon = () => {
        const { item } = this.props;

        // if memo contain xApp identifier then show xApp Icon
        if (item.getXappIdentifier()) {
            return <Image source={Images.IconXApp} style={[styles.xAppsIcon]} />;
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
                    name={changes.action === 'INC' ? 'IconLock' : 'IconUnlock'}
                    style={[AppStyles.imgColorGrey, AppStyles.paddingLeftSml]}
                    size={12}
                />
            );
        }

        return null;
    };

    renderRightPanel = () => {
        const { item, account } = this.props;

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
            incoming = item.Destination.address === account.address;
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
                        prefix={!!balanceChanges.sent && '-'}
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

        return null;
    };

    render() {
        return (
            <TouchableDebounce
                onPress={this.onPress}
                activeOpacity={0.6}
                style={[styles.container, { height: TransactionItem.Height }]}
            >
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>{this.getIcon()}</View>
                <View style={[AppStyles.flex3, AppStyles.centerContent]}>
                    <Text style={[styles.label]} numberOfLines={1}>
                        {this.getLabel()}
                    </Text>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <Text style={[styles.description]} numberOfLines={1}>
                            {this.getDescription()}
                        </Text>

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
