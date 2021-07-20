import React, { Component } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { isEmpty, isEqual } from 'lodash';

import { TransactionsType } from '@common/libs/ledger/transactions/types';
import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';
import { getAccountName } from '@common/helpers/resolver';
import { NormalizeCurrencyCode, NormalizeAmount } from '@common/utils/amount';
import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { Icon, Avatar } from '@components/General';

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
    tag: number;
    key: string;
}

/* Component ==================================================================== */
class LedgerObjectTemplate extends Component<Props, State> {
    private mounted: boolean;

    constructor(props: Props) {
        super(props);

        const recipientDetails = this.getRecipientDetails();

        this.state = {
            name: recipientDetails.name,
            address: recipientDetails.address,
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
            case 'Check':
                address = item.Destination.address;
                tag = item.Destination.tag;
                key = 'Destination';
                break;
            case 'Escrow':
                address = item.Destination.address;
                tag = item.Destination.tag;
                key = 'Destination';
                break;
            default:
                break;
        }

        // this this transactions are belong to account
        if (item.Type === 'Offer') {
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
                        });
                    }
                }
            })
            .catch(() => {});
    };

    onPress = () => {
        const { item, account } = this.props;
        Navigator.push(AppScreens.Transaction.Details, {}, { tx: item, account });
    };

    getIcon = () => {
        const { item } = this.props;
        const { address } = this.state;

        let iconName = '' as any;

        if (address) {
            return <Avatar size={40} border source={{ uri: `https://xumm.app/avatar/${address}_180_50.png` }} />;
        }

        switch (item.Type) {
            case 'Offer':
                iconName = 'IconSwitchAccount';
                break;
            default:
                iconName = 'IconAccount';
                break;
        }

        return (
            <View style={styles.iconContainer}>
                <Icon size={20} style={[styles.icon]} name={iconName} />
            </View>
        );
    };

    getLabel = () => {
        const { name, address } = this.state;
        const { item } = this.props;

        if (item.Type === 'Offer') {
            return `${Localize.formatNumber(NormalizeAmount(item.TakerGets.value))} ${NormalizeCurrencyCode(
                item.TakerGets.currency,
            )}/${NormalizeCurrencyCode(item.TakerPays.currency)}`;
        }

        if (name) return name;
        if (address) return address;

        return Localize.t('global.unknown');
    };

    getDescription = () => {
        const { item } = this.props;

        switch (item.Type) {
            case 'Escrow':
                return Localize.t('global.escrow');
            case 'Offer':
                return Localize.t('global.offer');
            case 'Check':
                return Localize.t('global.check');
            default:
                return item.Type;
        }
    };

    renderRightPanel = () => {
        const { item, account } = this.props;

        const incoming = item.Destination?.address === account.address;

        if (item.Type === 'Escrow') {
            return (
                <Text style={[styles.amount, incoming ? styles.orangeColor : styles.outgoingColor]} numberOfLines={1}>
                    {!incoming && '-'}
                    {Localize.formatNumber(item.Amount.value)}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.Amount.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'Check') {
            return (
                <Text style={[styles.amount, styles.naturalColor]} numberOfLines={1}>
                    {Localize.formatNumber(item.SendMax.value)}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.SendMax.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'Offer') {
            if (item.Executed) {
                const takerPaid = item.TakerPaid(account.address);

                return (
                    <Text style={[styles.amount]} numberOfLines={1}>
                        {Localize.formatNumber(takerPaid.value)}{' '}
                        <Text style={[styles.currency]}>{NormalizeCurrencyCode(takerPaid.currency)}</Text>
                    </Text>
                );
            }
            return (
                <Text style={[styles.amount, styles.naturalColor]} numberOfLines={1}>
                    {Localize.formatNumber(item.TakerPays.value)}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.TakerPays.currency)}</Text>
                </Text>
            );
        }

        return null;
    };

    render() {
        return (
            <TouchableOpacity onPress={this.onPress} activeOpacity={0.8} style={styles.container}>
                <View style={[AppStyles.flex1, AppStyles.centerContent]}>{this.getIcon()}</View>
                <View style={[AppStyles.flex3, AppStyles.centerContent]}>
                    <Text style={[styles.label]} numberOfLines={1}>
                        {this.getLabel()}
                    </Text>
                    <View style={[AppStyles.row, AppStyles.centerAligned]}>
                        <Text style={[styles.description]} numberOfLines={1}>
                            {this.getDescription()}
                        </Text>
                    </View>
                </View>
                <View style={[AppStyles.flex2, AppStyles.rightAligned, AppStyles.centerContent]}>
                    {this.renderRightPanel()}
                </View>
            </TouchableOpacity>
        );
    }
}

export default LedgerObjectTemplate;
