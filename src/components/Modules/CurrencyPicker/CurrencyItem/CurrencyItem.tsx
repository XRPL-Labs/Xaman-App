import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { AccountSchema, TrustLineSchema } from '@store/schemas/latest';

import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';

import { AmountText, TokenAvatar } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    account: AccountSchema;
    item: TrustLineSchema | string;
    selected?: boolean;
}

/* Component ==================================================================== */
class CurrencyItem extends Component<Props> {
    renderXRP = () => {
        const { account, selected } = this.props;

        return (
            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                <View style={[styles.currencyImageContainer]}>
                    <TokenAvatar token="XRP" border size={35} />
                </View>
                <View style={[AppStyles.column, AppStyles.centerContent]}>
                    <Text style={[styles.currencyItemLabel, selected && AppStyles.colorBlue]}>XRP</Text>
                    <Text style={[styles.currencyBalance]}>
                        {Localize.t('global.available')}: {Localize.formatNumber(CalculateAvailableBalance(account))}
                    </Text>
                </View>
            </View>
        );
    };

    renderIOU = (item: TrustLineSchema) => {
        const { selected } = this.props;

        return (
            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                <View style={[styles.currencyImageContainer]}>
                    <TokenAvatar token={item} border size={35} />
                </View>
                <View style={[AppStyles.column, AppStyles.centerContent]}>
                    <Text style={[styles.currencyItemLabel, selected && styles.currencyItemLabelSelected]}>
                        {NormalizeCurrencyCode(item.currency.currency)}
                        {item.currency.name && (
                            <Text style={[AppStyles.subtext, selected && styles.currencyItemLabelSelected]}>
                                {' '}
                                - {item.currency.name}
                            </Text>
                        )}
                    </Text>

                    <AmountText
                        prefix={`${Localize.t('global.balance')}: `}
                        style={[styles.currencyBalance]}
                        value={item.balance}
                    />
                </View>
            </View>
        );
    };

    render() {
        const { item } = this.props;
        // XRP
        if (typeof item === 'string') {
            return this.renderXRP();
        }
        // IOU
        // @ts-ignore
        return this.renderIOU(item);
    }
}

export default CurrencyItem;
