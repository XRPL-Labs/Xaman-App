import React, { PureComponent } from 'react';
import { View, Text, TouchableHighlight } from 'react-native';
import isEmpty from 'lodash/isEmpty';

import { TransactionsType } from '@common/libs/ledger/types';
import { AccountSchema } from '@store/schemas/latest';

import { Navigator, getAccountInfo } from '@common/helpers';
import { NormalizeCurrencyCode } from '@common/libs/utils';
import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { AppStyles } from '@theme';

import { Icon } from '@components';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    item: TransactionsType;
}

export interface State {
    name: string;
    address: string;
}

/* Component ==================================================================== */
class TransactionTemplate extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            name: '',
            address: '',
        };
    }

    componentDidMount() {
        this.setPartiesDetails();
    }

    setPartiesDetails = () => {
        const { item, account } = this.props;

        let address;

        switch (item.Type) {
            case 'Payment':
                if (item.Destination.address === account.address) {
                    address = item.Account.address;
                } else {
                    address = item.Destination.address;
                }
                break;
            case 'TrustSet':
                address = item.Issuer;
                break;
            case 'EscrowCreate':
                address = item.Destination.address;
                break;
            case 'EscrowFinish':
                address = item.Owner;
                break;
            default:
                break;
        }

        // this transactions don't have destination so we can fetch name from our account
        if (
            item.Type === 'AccountSet' ||
            item.Type === 'SignerListSet' ||
            item.Type === 'OfferCreate' ||
            item.Type === 'OfferCancel'
        ) {
            this.setState({
                address,
                name: account.label,
            });
            return;
        }

        this.setState({
            address,
        });

        getAccountInfo(address)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        name: res.name,
                    });
                }
            })
            .catch(() => {});
    };

    onPress = () => {
        const { item, account } = this.props;
        Navigator.push(AppScreens.Transaction.Details, {}, { tx: item, account: account.address });
    };

    getIcon = () => {
        const { item, account } = this.props;

        let iconName = '' as any;
        let iconColor;

        if (item.Type === 'Payment') {
            const incoming = item.Destination.address === account.address;
            if (incoming) {
                iconColor = styles.incomingColor;
            } else {
                iconColor = styles.outgoingColor;
            }
        }

        switch (item.Type) {
            case 'Payment':
                if (item.Destination.address === account.address) {
                    iconName = 'IconCornerRightDown';
                } else {
                    iconName = 'IconCornerLeftUp';
                }
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
            default:
                iconName = 'IconAccount';
                break;
        }

        return <Icon size={25} style={[styles.icon, iconColor]} name={iconName} />;
    };

    getLabel = () => {
        const { name, address } = this.state;
        if (name) return name;
        if (address) return address;

        return Localize.t('global.unknown');
    };

    getDescription = () => {
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
                if (item.Flags?.ImmediateOrCancel) {
                    return Localize.t('events.exchangedCurrencies');
                }
                return Localize.t('events.createOffer');
            case 'OfferCancel':
                return Localize.t('events.cancelOffer');
            default:
                return item.Type;
        }
    };

    renderRightPanel = () => {
        const { item, account } = this.props;

        const incoming = item.Destination?.address === account.address;

        if (item.Type === 'Payment') {
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
        return null;
    };

    render() {
        return (
            <TouchableHighlight onPress={this.onPress} underlayColor="#FFF">
                <View style={[AppStyles.row, styles.row]}>
                    <View style={[AppStyles.flex1, AppStyles.centerContent]}>
                        <View style={styles.iconContainer}>{this.getIcon()}</View>
                    </View>
                    <View style={[AppStyles.flex3, AppStyles.centerContent]}>
                        <Text style={[styles.label]} numberOfLines={1}>
                            {this.getDescription()}
                        </Text>
                        <Text style={[styles.description]} numberOfLines={1}>
                            {this.getLabel()}
                        </Text>
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
