import React, { Component } from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import { isEmpty, isEqual } from 'lodash';

import { TransactionsType } from '@common/libs/ledger/transactions/types';
import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';
import { getAccountName } from '@common/helpers/resolver';
import { NormalizeCurrencyCode, Truncate } from '@common/libs/utils';
import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { Icon } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    item: TransactionsType;
}

export interface State {
    name: string;
    address: string;
    tag: number
}

/* Component ==================================================================== */
class TransactionTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        const recipientDetails = this.getRecipientDetails();

        this.state = {
            name: recipientDetails.name,
            address: recipientDetails.address,
            tag: recipientDetails.tag,
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return !isEqual(nextState, this.state);
    }

    componentDidMount() {
        const { name } = this.state;

        if (!name) {
            this.lookUpRecipientName();
        }
    }

    getRecipientDetails = () => {
        const { item, account } = this.props;


        let address;
        let tag;

        switch (item.Type) {
            case 'Payment':
                if (item.Destination.address === account.address) {
                    address = item.Account.address;
                } else {
                    address = item.Destination.address;
                    tag = item.Destination.tag;
                }
                break;
            case 'AccountDelete':
                address = item.Account.address;
                break;
            case 'CheckCreate':
                address = item.Destination.address;
                tag = item.Destination.tag;
                break;
            case 'CheckCash':
                address = item.Account.address;
                break;
            case 'CheckCancel':
                address = item.Account.address;
                break;
            case 'TrustSet':
                address = item.Issuer;
                break;
            case 'EscrowCreate':
                address = item.Destination.address;
                tag = item.Destination.tag;
                break;
            case 'EscrowFinish':
                address = item.Destination.address;
                tag = item.Destination.tag;
                break;
            case 'DepositPreauth':
                address = item.Authorize || item.Unauthorize;
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

            };
        }


        return {
            address,
            tag,
            name: undefined,
        };
    }

    lookUpRecipientName = () => {
        const { address, tag } = this.state;


        getAccountName(address, tag)
            .then((res: any) => {
                if (!isEmpty(res) && res.name) {
                    this.setState({
                        name: res.name,
                    });
                }
            })
            .catch(() => {});
    };

    onPress = () => {
        const { item, account } = this.props;
        Navigator.push(AppScreens.Transaction.Details, {}, { tx: item, account });
    };

    getIcon = () => {
        const { item, account } = this.props;

        let iconName = '' as any;
        let iconColor;

        switch (item.Type) {
            case 'Payment':
                if (item.Destination.address === account.address) {
                    iconName = 'IconCornerRightDown';
                    iconColor = styles.incomingColor;
                } else {
                    iconName = 'IconCornerLeftUp';
                    iconColor = styles.outgoingColor;
                }
                break;
            case 'OfferCreate':
                iconName = 'IconSwitchAccount';
                break;
            case 'TrustSet':
                if (item.Limit === 0) {
                    iconName = 'IconMinus';
                } else {
                    iconName = 'IconPlus';
                }
                break;
            case 'EscrowFinish':
                iconName = 'IconCheck';
                break;
            case 'EscrowCreate':
                iconName = 'IconCornerLeftUp';
                break;
            case 'EscrowCancel':
                iconName = 'IconX';
                break;
            case 'CheckCreate':
                if (item.Account.address === account.address) {
                    iconName = 'IconCornerLeftUp';
                    iconColor = styles.incomingColor;
                } else {
                    iconName = 'IconCornerRightDown';
                    iconColor = styles.outgoingColor;
                }
                break;
            case 'CheckCash':
                if (item.Account.address === account.address) {
                    iconName = 'IconCornerRightDown';
                } else {
                    iconName = 'IconCornerLeftUp';
                }
                break;
            case 'CheckCancel':
                iconName = 'IconX';
                break;
            default:
                iconName = 'IconAccount';
                break;
        }

        return <Icon size={25} style={[styles.icon, iconColor]} name={iconName} />;
    };

    getDescription = () => {
        const { name, address } = this.state;
        const { item } = this.props;

        if (item.Type === 'OfferCreate') {
            return `${item.TakerGets.value} ${NormalizeCurrencyCode(item.TakerGets.currency)}/${NormalizeCurrencyCode(
                item.TakerPays.currency,
            )}`;
        }

        if (name) return name;
        if (address) return Truncate(address, 20);

        return Localize.t('global.unknown');
    };

    getLabel = () => {
        const { item, account } = this.props;

        switch (item.Type) {
            case 'Payment':
                if (item.Destination.address === account.address) {
                    return Localize.t('events.paymentReceived');
                }
                return Localize.t('events.paymentSent');
            case 'TrustSet':
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
            default:
                return item.Type;
        }
    };

    renderMemoIcon = () => {
        const { item } = this.props;

        if (item.Memos) {
            return (
                <Icon name="IconFileText" style={[AppStyles.imgColorGreyDark, AppStyles.paddingLeftSml]} size={12} />
            );
        }

        return null;
    };

    renderRightPanel = () => {
        const { item, account } = this.props;

        let incoming = item.Destination?.address === account.address;

        if (item.Type === 'Payment') {
            return (
                <Text style={[styles.amount, incoming ? styles.incomingColor : styles.outgoingColor]} numberOfLines={1}>
                    {incoming ? '' : '-'}
                    {item.Amount.value}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.Amount.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'AccountDelete') {
            return (
                <Text style={[styles.amount, incoming ? styles.incomingColor : styles.outgoingColor]} numberOfLines={1}>
                    {incoming ? '' : '-'}
                    {item.Amount.value}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.Amount.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'EscrowCreate') {
            return (
                <Text style={[styles.amount, incoming ? styles.orangeColor : styles.outgoingColor]} numberOfLines={1}>
                    -{item.Amount.value}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.Amount.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'EscrowFinish') {
            return (
                <Text style={[styles.amount, incoming ? styles.incomingColor : styles.naturalColor]} numberOfLines={1}>
                    {item.Amount.value}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.Amount.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'CheckCreate') {
            return (
                <Text style={[styles.amount, styles.naturalColor]} numberOfLines={1}>
                    {item.SendMax.value}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.SendMax.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'CheckCash') {
            const amount = item.Amount || item.DeliverMin;
            incoming = item.Account.address === account.address;
            return (
                <Text style={[styles.amount, incoming ? styles.incomingColor : styles.outgoingColor]} numberOfLines={1}>
                    {incoming ? '' : '-'}
                    {amount.value} <Text style={[styles.currency]}>{NormalizeCurrencyCode(amount.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'OfferCreate') {
            if (item.Executed) {
                return (
                    <Text style={[styles.amount, styles.incomingColor]} numberOfLines={1}>
                        {item.TakerPaid.value}{' '}
                        <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.TakerPaid.currency)}</Text>
                    </Text>
                );
            }
            return (
                <Text style={[styles.amount, styles.naturalColor]} numberOfLines={1}>
                    {item.TakerPays.value}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.TakerPays.currency)}</Text>
                </Text>
            );
        }

        return null;
    };

    render() {
        return (
            <TouchableHighlight onPress={this.onPress} underlayColor="#FFF">
                <View style={[AppStyles.row, styles.container]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <View style={styles.iconContainer}>{this.getIcon()}</View>
                    </View>
                    <View style={[AppStyles.flex3, AppStyles.centerContent]}>
                        <Text style={[styles.label]} numberOfLines={1}>
                            {this.getLabel()}
                        </Text>
                        <View style={[AppStyles.row, AppStyles.centerAligned]}>
                            <Text style={[styles.description]} numberOfLines={1}>
                                {this.getDescription()}
                            </Text>

                            {this.renderMemoIcon()}
                        </View>
                    </View>
                    <View style={[AppStyles.flex2, AppStyles.rightAligned, AppStyles.centerContent]}>
                        {this.renderRightPanel()}
                    </View>
                </View>
            </TouchableHighlight>
        );
    }
}

export default TransactionTemplate;
