import React, { Component } from 'react';
import { View, Text, TouchableHighlight, Image } from 'react-native';
import { isEmpty, isEqual } from 'lodash';

import { TransactionsType } from '@common/libs/ledger/transactions/types';
import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';
import { getAccountName } from '@common/helpers/resolver';
import { NormalizeCurrencyCode, FormatNumber } from '@common/libs/utils';
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
    tag: number;
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
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return !isEqual(nextState, this.state);
    }

    componentDidMount() {
        const { name } = this.state;

        this.mounted = true;

        if (!name) {
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

        switch (item.Type) {
            case 'Check':
                address = item.Destination.address;
                tag = item.Destination.tag;
                break;
            case 'Escrow':
                address = item.Destination.address;
                tag = item.Destination.tag;
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
            };
        }

        return {
            address,
            tag,
            name: undefined,
        };
    };

    lookUpRecipientName = () => {
        const { address, tag } = this.state;

        getAccountName(address, tag)
            .then((res: any) => {
                if (!isEmpty(res) && res.name) {
                    if (this.mounted) {
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
        let iconColor;

        if (address) {
            return <Image style={styles.avatarImage} source={{ uri: `https://xumm.app/avatar/${address}.png` }} />;
        }

        switch (item.Type) {
            case 'Offer':
                iconName = 'IconSwitchAccount';
                break;
            default:
                iconName = 'IconAccount';
                break;
        }

        return <Icon size={20} style={[styles.icon, iconColor]} name={iconName} />;
    };

    getLabel = () => {
        const { name, address } = this.state;
        const { item } = this.props;

        if (item.Type === 'Offer') {
            return `${FormatNumber(item.TakerGets.value)} ${NormalizeCurrencyCode(
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
                    -{FormatNumber(item.Amount.value)}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.Amount.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'Check') {
            return (
                <Text style={[styles.amount, styles.naturalColor]} numberOfLines={1}>
                    {FormatNumber(item.SendMax.value)}{' '}
                    <Text style={[styles.currency]}>{NormalizeCurrencyCode(item.SendMax.currency)}</Text>
                </Text>
            );
        }

        if (item.Type === 'Offer') {
            if (item.Executed) {
                const takerPaid = item.TakerPaid(account.address);

                return (
                    <Text style={[styles.amount]} numberOfLines={1}>
                        {FormatNumber(takerPaid.value)}{' '}
                        <Text style={[styles.currency]}>{NormalizeCurrencyCode(takerPaid.currency)}</Text>
                    </Text>
                );
            }
            return (
                <Text style={[styles.amount, styles.naturalColor]} numberOfLines={1}>
                    {FormatNumber(item.TakerPays.value)}{' '}
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

export default LedgerObjectTemplate;
