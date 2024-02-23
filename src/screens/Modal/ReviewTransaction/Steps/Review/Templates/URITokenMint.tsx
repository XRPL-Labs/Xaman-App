import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { URITokenMint } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: URITokenMint;
}

export interface State {}

/* Component ==================================================================== */
class URITokenMintTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.URI && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.uri')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.URI}</Text>
                        </View>
                    </>
                )}

                {!isEmpty(transaction.Digest) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.digest')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.Digest}</Text>
                        </View>
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
            </>
        );
    }
}

export default URITokenMintTemplate;
