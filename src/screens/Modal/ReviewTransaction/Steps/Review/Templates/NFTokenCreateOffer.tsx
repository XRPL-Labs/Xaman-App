import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenCreateOffer } from '@common/libs/ledger/transactions';

import { FormatDate } from '@common/utils/date';

import { AmountText } from '@components/General';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: NFTokenCreateOffer;
}

export interface State {}

/* Component ==================================================================== */
class NFTokenCreateOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.Destination && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.destination')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Destination.address}
                            tag={transaction.Destination.tag}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {transaction.Owner && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.owner')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Owner}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {transaction.Amount && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={transaction.Amount.value}
                                currency={transaction.Amount.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.NFTokenID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.tokenID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.NFTokenID}</Text>
                        </View>
                    </>
                )}

                {transaction.Expiration && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.expireAfter')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(transaction.Expiration)}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default NFTokenCreateOfferTemplate;
