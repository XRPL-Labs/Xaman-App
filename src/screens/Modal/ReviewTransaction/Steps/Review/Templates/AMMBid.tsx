import { isEmpty, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { AMMBid } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';
import { AccountElement, CurrencyElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: AMMBid;
}

export interface State {}

/* Component ==================================================================== */
class AMMBidTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    renderAuthAccounts = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.AuthAccounts)) {
            return (
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{Localize.t('global.empty')}</Text>
                </View>
            );
        }

        return transaction.AuthAccounts.map((item) => {
            return (
                <View key={item.account}>
                    <AccountElement address={item.account} />
                </View>
            );
        });
    };

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.Asset) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.asset')}</Text>
                        <View style={styles.contentBox}>
                            <CurrencyElement issuer={transaction.Asset.issuer} currency={transaction.Asset.currency} />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.Asset2) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.asset2')}</Text>
                        <View style={styles.contentBox}>
                            <CurrencyElement
                                issuer={transaction.Asset2.issuer}
                                currency={transaction.Asset2.currency}
                            />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.BidMin) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.bidMin')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.BidMin.value}
                                currency={transaction.BidMin.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {!isUndefined(transaction.BidMax) && (
                    <>
                        <Text style={styles.label}>{Localize.t('events.bidMax')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.BidMax.value}
                                currency={transaction.BidMax.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('events.authAccounts')}
                    </Text>
                </View>
                {this.renderAuthAccounts()}
            </>
        );
    }
}

export default AMMBidTemplate;
