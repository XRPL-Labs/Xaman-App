import React, { Component } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { isEmpty, isEqual, debounce } from 'lodash';

import { TransactionsType } from '@common/libs/ledger/transactions/types';
import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';
import { getAccountName } from '@common/helpers/resolver';
import { Images } from '@common/helpers/images';
import { NormalizeCurrencyCode, NormalizeAmount } from '@common/utils/amount';
import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { Icon, Avatar, AmountText } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    item: TransactionsType;
    timestamp?: number;
}

export interface State {
    name: string;
    address: string;
    kycApproved: boolean;
    tag: number;
    key: string;
}

/* Component ==================================================================== */
class TransactionTemplate extends Component<Props, State> {
    private mounted: boolean;

    constructor(props: Props) {
        super(props);

        const recipientDetails = this.getRecipientDetails();

        this.state = {
            name: recipientDetails.name,
            address: recipientDetails.address,
            kycApproved: false,
            tag: recipientDetails.tag,
            key: recipientDetails.key,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        const { timestamp } = this.props;
        return !isEqual(nextState, this.state) || !isEqual(nextProps.timestamp, timestamp);
    }

    componentDidMount() {
        const { name, key } = this.state;
        const { item } = this.props;

        this.mounted = true;

        if (!name) {
            this.lookUpRecipientName();
        } else if (key) {
            item[key] = {
                name,
            };
        }
    }

    componentDidUpdate(prevProps: Props) {
        const { timestamp } = this.props;

        // force the lookup if timestamp changed
        if (timestamp !== prevProps.timestamp) {
            this.lookUpRecipientName();
        }
    }

    componentWillUnmount() {
        this.mounted = false;
    }

    getRecipientDetails = () => {
        const { item, account } = this.props;

        let address;
        let tag;
        let key;

        switch (item.Type) {
            case 'Payment':
                if (item.Account?.address !== account.address) {
                    address = item.Account.address;
                    key = 'Account';
                } else {
                    address = item.Destination.address;
                    tag = item.Destination.tag;
                    key = 'Destination';
                }
                break;
            case 'AccountDelete':
                address = item.Account.address;
                key = 'Account';
                break;
            case 'CheckCreate':
                if (item.Account?.address !== account.address) {
                    address = item.Account.address;
                    key = 'Account';
                } else {
                    address = item.Destination.address;
                    tag = item.Destination.tag;
                    key = 'Destination';
                }
                break;
            case 'CheckCash':
                address = item.Account.address;
                key = 'Account';
                break;
            case 'CheckCancel':
                address = item.Account.address;
                key = 'Account';
                break;
            case 'TrustSet':
                address = item.Issuer;
                break;
            case 'EscrowCreate':
                address = item.Destination.address;
                tag = item.Destination.tag;
                key = 'Destination';
                break;
            case 'EscrowCancel':
                address = item.Owner;
                break;
            case 'EscrowFinish':
                address = item.Destination.address;
                tag = item.Destination.tag;
                key = 'Destination';
                break;
            case 'DepositPreauth':
                address = item.Authorize || item.Unauthorize;
                break;
            case 'TicketCreate':
                address = item.Account.address;
                key = 'Account';
                break;
            case 'PaymentChannelCreate':
                if (item.Account?.address !== account.address) {
                    address = item.Account.address;
                    key = 'Account';
                } else {
                    address = item.Destination.address;
                    tag = item.Destination.tag;
                    key = 'Destination';
                }
                break;
            case 'PaymentChannelFund':
                address = item.Account.address;
                key = 'Account';
                break;
            case 'PaymentChannelClaim':
                address = item.Account.address;
                key = 'Account';
                break;
            case 'NFTokenMint':
                if (item.Issuer) {
                    address = item.Issuer;
                    key = 'Issuer';
                } else {
                    address = item.Account.address;
                    key = 'Account';
                }
                break;
            case 'NFTokenBurn':
                address = item.Account.address;
                key = 'Account';
                break;
            case 'NFTokenCreateOffer':
                address = item.Owner;
                key = 'Owner';
                break;
            case 'NFTokenCancelOffer':
                address = item.Account.address;
                key = 'Account';
                break;
            case 'NFTokenOfferAccept':
                address = item.Account.address;
                key = 'Account';
                break;
            default:
                break;
        }

        // this this transactions are belong to account
        if (
            item.Type === 'AccountSet' ||
            item.Type === 'SignerListSet' ||
            item.Type === 'SetRegularKey' ||
            item.Type === 'OfferCancel' ||
            item.Type === 'OfferCreate'
        ) {
            return {
                address,
                tag,
                name: account.label,
                key: 'Account',
            };
        }

        return {
            address,
            tag,
            name: undefined,
            key,
        };
    };

    lookUpRecipientName = () => {
        const { address, tag, key } = this.state;
        const { item } = this.props;

        getAccountName(address, tag)
            .then((res: any) => {
                if (!isEmpty(res) && res.name) {
                    if (this.mounted) {
                        if (key) {
                            item[key] = {
                                name: res.name,
                            };
                        }
                        this.setState({
                            name: res.name,
                            kycApproved: res.kycApproved,
                        });
                    }
                }
            })
            .catch(() => {});
    };

    debouncedOnPress = () => {
        const { item, account } = this.props;
        Navigator.push(AppScreens.Transaction.Details, {}, { tx: item, account });
    };

    onPress = debounce(this.debouncedOnPress, 300, { leading: true, trailing: false });

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
            case 'OfferCreate':
            case 'Payment':
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

        if (item.Type === 'OfferCreate') {
            if (item.Executed) {
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

        if (item.Type === 'Payment') {
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
        if (address) return address;

        return Localize.t('global.unknown');
    };

    getDescription = () => {
        const { item, account } = this.props;

        switch (item.Type) {
            case 'Payment':
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
            case 'TrustSet':
                if (item.Account.address !== account.address && item.Limit !== 0) {
                    return Localize.t('events.incomingTrustLineAdded');
                }
                if (item.Limit === 0) {
                    return Localize.t('events.removedATrustLine');
                }
                return Localize.t('events.addedATrustLine');
            case 'EscrowCreate':
                return Localize.t('events.createEscrow');
            case 'EscrowFinish':
                return Localize.t('events.finishEscrow');
            case 'EscrowCancel':
                return Localize.t('events.cancelEscrow');
            case 'AccountSet':
                return Localize.t('events.accountSettings');
            case 'SignerListSet':
                return Localize.t('events.setSignerList');
            case 'OfferCreate':
                if (item.Executed) {
                    return Localize.t('events.exchangedAssets');
                }
                return Localize.t('events.createOffer');
            case 'OfferCancel':
                return Localize.t('events.cancelOffer');
            case 'AccountDelete':
                return Localize.t('events.deleteAccount');
            case 'SetRegularKey':
                return Localize.t('events.setRegularKey');
            case 'DepositPreauth':
                if (item.Authorize) {
                    return Localize.t('events.authorizeDeposit');
                }
                return Localize.t('events.unauthorizeDeposit');
            case 'CheckCreate':
                return Localize.t('events.createCheck');
            case 'CheckCash':
                return Localize.t('events.cashCheck');
            case 'CheckCancel':
                return Localize.t('events.cancelCheck');
            case 'TicketCreate':
                return Localize.t('events.createTicket');
            case 'PaymentChannelCreate':
                return Localize.t('events.createPaymentChannel');
            case 'PaymentChannelClaim':
                return Localize.t('events.claimPaymentChannel');
            case 'PaymentChannelFund':
                return Localize.t('events.fundPaymentChannel');
            case 'NFTokenMint':
                return Localize.t('events.mintNFToken');
            case 'NFTokenBurn':
                return Localize.t('events.burnNFToken');
            case 'NFTokenCreateOffer':
                return Localize.t('events.createNFTokenOffer');
            case 'NFTokenCancelOffer':
                return Localize.t('events.cancelNFTokenOffer');
            case 'NFTokenOfferAccept':
                return Localize.t('events.acceptNFTokenOffer');
            default:
                return item.Type;
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

        const changes = item.OwnerCountChange(account.address);

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

        if (item.Type === 'Payment') {
            const balanceChanges = item.BalanceChange(account.address);
            const amount = item.DeliveredAmount || item.Amount;

            if ([item.Account.address, item.Destination?.address].indexOf(account.address) === -1) {
                // regular key
                if (!balanceChanges?.received && !balanceChanges?.sent) {
                    return (
                        <AmountText
                            value={amount.value}
                            postfix={amount.currency}
                            style={[styles.amount, styles.naturalColor]}
                            postfixStyle={styles.currency}
                        />
                    );
                }
                if (balanceChanges?.received) {
                    return (
                        <AmountText
                            value={balanceChanges.received?.value}
                            postfix={balanceChanges.received?.currency}
                            style={styles.amount}
                            postfixStyle={styles.currency}
                        />
                    );
                }
            }

            return (
                <AmountText
                    value={amount.value}
                    postfix={amount.currency}
                    prefix={!incoming && '-'}
                    style={[styles.amount, !incoming && styles.outgoingColor]}
                    postfixStyle={styles.currency}
                />
            );
        }

        if (item.Type === 'AccountDelete') {
            return (
                <AmountText
                    value={item.Amount.value}
                    postfix={item.Amount.currency}
                    prefix={!incoming && '-'}
                    style={[styles.amount, !incoming && styles.outgoingColor]}
                    postfixStyle={styles.currency}
                />
            );
        }

        if (item.Type === 'EscrowCreate') {
            return (
                <AmountText
                    value={item.Amount.value}
                    postfix={item.Amount.currency}
                    prefix={!incoming && '-'}
                    style={[styles.amount, incoming ? styles.orangeColor : styles.outgoingColor]}
                    postfixStyle={styles.currency}
                />
            );
        }

        if (item.Type === 'EscrowFinish') {
            return (
                <AmountText
                    value={item.Amount.value}
                    postfix={item.Amount.currency}
                    prefix={!incoming && '-'}
                    style={[styles.amount, !incoming && styles.naturalColor]}
                    postfixStyle={styles.currency}
                />
            );
        }

        if (item.Type === 'CheckCreate') {
            return (
                <AmountText
                    value={item.SendMax.value}
                    postfix={item.SendMax.currency}
                    style={[styles.amount, styles.naturalColor]}
                    postfixStyle={styles.currency}
                />
            );
        }

        if (item.Type === 'CheckCash') {
            const amount = item.Amount || item.DeliverMin;
            incoming = item.Account.address === account.address;
            return (
                <AmountText
                    value={amount.value}
                    postfix={amount.currency}
                    style={[styles.amount, !incoming && styles.outgoingColor]}
                    postfixStyle={styles.currency}
                />
            );
        }

        if (item.Type === 'OfferCreate') {
            if (item.Executed) {
                const takerPaid = item.TakerPaid(account.address);

                return (
                    <AmountText
                        value={takerPaid.value}
                        postfix={takerPaid.currency}
                        style={[styles.amount]}
                        postfixStyle={styles.currency}
                    />
                );
            }
            return (
                <AmountText
                    value={item.TakerPays.value}
                    postfix={item.TakerPays.currency}
                    style={[styles.amount, styles.naturalColor]}
                    postfixStyle={styles.currency}
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
                        postfix={amount.currency}
                        style={[styles.amount, !!balanceChanges.sent && styles.outgoingColor]}
                        postfixStyle={styles.currency}
                    />
                );
            }
        }

        return null;
    };

    render() {
        return (
            <TouchableOpacity onPress={this.onPress} activeOpacity={0.6} style={[styles.container]}>
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
            </TouchableOpacity>
        );
    }
}

export default TransactionTemplate;
