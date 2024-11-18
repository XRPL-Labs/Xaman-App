import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { URITokenCreateSellOffer } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';
import { AccountElement, URITokenElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: URITokenCreateSellOffer;
}

export interface State {}

/* Component ==================================================================== */
class URITokenCreateSellOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.uritoken')}</Text>
                <View style={styles.contentBox}>
                    <URITokenElement
                        uriTokenId={transaction!.URITokenID}
                        truncate={false}
                        containerStyle={styles.uriTokenContainer}
                    />
                </View>

                {transaction.Destination && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.destination')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Destination}
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
            </>
        );
    }
}

export default URITokenCreateSellOfferTemplate;
