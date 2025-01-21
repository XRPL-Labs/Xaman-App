import { isUndefined } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { MPTokenIssuanceCreate } from '@common/libs/ledger/transactions';

import { ReadMore } from '@components/General';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
import { AppStyles } from '@theme';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: MPTokenIssuanceCreate;
}

export interface State {}

/* Component ==================================================================== */
class MPTokenIssuanceCreateTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.AssetScale) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.assetScale')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.AssetScale ?? Localize.t('global.empty')}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.MaximumAmount) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.maximumAmount')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.MaximumAmount || Localize.t('global.empty')}</Text>
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

                {!isUndefined(transaction.MPTokenMetadata) && (
                    <>
                        <View style={AppStyles.row}>
                            <Text style={styles.label}>{Localize.t('global.mpTokenMetadata')}</Text>
                        </View>
                        <View style={styles.contentBox}>
                            <ReadMore numberOfLines={3} textStyle={styles.value}>
                                {transaction.MPTokenMetadata || Localize.t('global.empty')}
                            </ReadMore>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default MPTokenIssuanceCreateTemplate;
