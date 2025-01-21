import { isUndefined } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { MPTokenIssuanceSet } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: MPTokenIssuanceSet;
}

export interface State {}

/* Component ==================================================================== */
class MPTokenIssuanceSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.Holder) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.holder')}</Text>
                        <AccountElement
                            address={transaction.Holder}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {!isUndefined(transaction.MPTokenIssuanceID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.mpTokenIssuanceID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>
                                {transaction.MPTokenIssuanceID || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default MPTokenIssuanceSetTemplate;
