import React, { Component } from 'react';
import { View, Text } from 'react-native';

import NetworkService from '@services/NetworkService';

import { AccountModel, TrustLineModel } from '@store/models';

import { NormalizeCurrencyCode } from '@common/utils/amount';
import { CalculateAvailableBalance } from '@common/utils/balance';

import { AmountText, TokenAvatar } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
interface Props {
    account: AccountModel;
    item: TrustLineModel | string;
    selected?: boolean;
}

/* Component ==================================================================== */
class CurrencyItem extends Component<Props> {
    renderNative = () => {
        const { account, selected } = this.props;

        return (
            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                <View style={styles.currencyImageContainer}>
                    <TokenAvatar token="Native" border size={35} />
                </View>
                <View style={[AppStyles.column, AppStyles.centerContent]}>
                    <Text style={[styles.currencyItemLabel, selected && AppStyles.colorBlue]}>
                        {NetworkService.getNativeAsset()}
                    </Text>
                    <Text style={styles.currencyBalance}>
                        {Localize.t('global.available')}: {Localize.formatNumber(CalculateAvailableBalance(account))}
                    </Text>
                </View>
            </View>
        );
    };

    renderIOU = (item: TrustLineModel) => {
        const { selected } = this.props;

        return (
            <View style={[AppStyles.row, AppStyles.centerAligned]}>
                <View style={styles.currencyImageContainer}>
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
        // native
        if (typeof item === 'string') {
            return this.renderNative();
        }
        // IOU
        return this.renderIOU(item);
    }
}

export default CurrencyItem;
