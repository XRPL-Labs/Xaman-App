import { isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenMint } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';
import { AccountElement } from '@components/Modules';

import { FormatDate } from '@common/utils/date';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: NFTokenMint;
}

export interface State {}

/* Component ==================================================================== */
class NFTokenMintTemplate extends Component<Props, State> {
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

                {transaction.Expiration && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.expireAfter')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(transaction.Expiration)}</Text>
                        </View>
                    </>
                )}

                {transaction.Issuer && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.issuer')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Issuer}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {!isUndefined(transaction.NFTokenTaxon) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.tokenTaxon')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.NFTokenTaxon}</Text>
                        </View>
                    </>
                )}

                {transaction.URI && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.uri')}</Text>
                        <View style={styles.contentBox}>
                            <Text selectable style={styles.value}>
                                {transaction.URI}
                            </Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.TransferFee) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.transferFee')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.TransferFee}%</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default NFTokenMintTemplate;
