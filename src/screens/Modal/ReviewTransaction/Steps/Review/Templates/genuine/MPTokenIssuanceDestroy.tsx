import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { MPTokenIssuanceDestroy } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: MPTokenIssuanceDestroy;
}

export interface State {}

/* Component ==================================================================== */
class MPTokenIssuanceDestroyTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.mpTokenIssuanceID')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.MPTokenIssuanceID || Localize.t('global.empty')}</Text>
                </View>
            </>
        );
    }
}

export default MPTokenIssuanceDestroyTemplate;
