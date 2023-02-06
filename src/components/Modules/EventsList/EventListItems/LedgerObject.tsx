import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { isEmpty, isEqual } from 'lodash';

import { LedgerObjects } from '@common/libs/ledger/objects/types';
import { LedgerObjectTypes } from '@common/libs/ledger/types';
import { AccountSchema } from '@store/schemas/latest';

import { Navigator } from '@common/helpers/navigator';
import { getAccountName } from '@common/helpers/resolver';
import { NormalizeAmount, NormalizeCurrencyCode } from '@common/utils/amount';
import { AppScreens } from '@common/constants';

import Localize from '@locale';

import { AmountText, Avatar, Icon, TouchableDebounce } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    account: AccountSchema;
    item: LedgerObjects;
    timestamp?: number;
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
        const { timestamp } = this.props;
        return !isEqual(nextState, this.state) || !isEqual(nextProps.timestamp, timestamp);
    }

    componentDidMount() {
        const { name } = this.state;

        this.mounted = true;

        if (!name) {
            this.lookUpRecipientName();
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

        switch (item.Type) {
            case LedgerObjectTypes.Check:
            case LedgerObjectTypes.Escrow:
                return {
                    address: item.Destination.address,
                    tag: item.Destination.tag,
                };
            case LedgerObjectTypes.NFTokenOffer:
            case LedgerObjectTypes.Offer:
            case LedgerObjectTypes.Ticket:
                return {
                    address: account.address,
                    name: account.label,
                };

            default:
                return {};
        }
    };

    lookUpRecipientName = () => {
        const { address, tag } = this.state;

        if (!address) {
            return;
        }

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
        Navigator.push(AppScreens.Transaction.Details, { tx: item, account });
    };

    getIcon = () => {
        const { item } = this.props;
        const { address } = this.state;

        let iconName = '' as any;

        if (address) {
            return <Avatar size={40} border source={{ uri: `https://xumm.app/avatar/${address}_180_50.png` }} />;
        }

        switch (item.Type) {
            case LedgerObjectTypes.Offer:
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

        if (item.Type === LedgerObjectTypes.Offer) {
            return `${Localize.formatNumber(NormalizeAmount(item.TakerGets.value))} ${NormalizeCurrencyCode(
                item.TakerGets.currency,
            )}/${NormalizeCurrencyCode(item.TakerPays.currency)}`;
        }

        if (item.Type === LedgerObjectTypes.NFTokenOffer) {
            return item.NFTokenID;
        }

        if (name) return name;
        if (address) return address;

        return Localize.t('global.unknown');
    };

    getDescription = () => {
        const { item } = this.props;

        switch (item.Type) {
            case LedgerObjectTypes.Escrow:
                return Localize.t('global.escrow');
            case LedgerObjectTypes.Offer:
                return Localize.t('global.offer');
            case LedgerObjectTypes.NFTokenOffer:
                if (item.Flags.SellToken) {
                    return Localize.t('events.sellNFToken');
                }
                return Localize.t('events.buyNFToken');
            case LedgerObjectTypes.Check:
                return Localize.t('global.check');
            case LedgerObjectTypes.Ticket:
                return `${Localize.t('global.ticket')} #${item.TicketSequence}`;
            default:
                // @ts-ignore
                return item.Type;
        }
    };

    renderRightPanel = () => {
        const { item, account } = this.props;

        if (item.Type === LedgerObjectTypes.Escrow) {
            const incoming = item.Destination?.address === account.address;
            return (
                <AmountText
                    value={item.Amount.value}
                    currency={item.Amount.currency}
                    prefix={!incoming && '-'}
                    style={[styles.amount, incoming ? styles.orangeColor : styles.outgoingColor]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        if (item.Type === LedgerObjectTypes.Check) {
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

        if (item.Type === LedgerObjectTypes.Offer) {
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

        if (item.Type === LedgerObjectTypes.NFTokenOffer) {
            return (
                <AmountText
                    value={item.Amount.value}
                    currency={item.Amount.currency}
                    style={[styles.amount, styles.naturalColor]}
                    currencyStyle={styles.currency}
                    valueContainerStyle={styles.amountValueContainer}
                    truncateCurrency
                />
            );
        }

        return null;
    };

    render() {
        return (
            <TouchableDebounce onPress={this.onPress} activeOpacity={0.8} style={styles.container}>
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
            </TouchableDebounce>
        );
    }
}

export default LedgerObjectTemplate;
