import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Clawback } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Clawback;
}

export interface State {}

/* Component ==================================================================== */
class ClawbackTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                <View style={styles.contentBox}>
                    <AmountText
                        value={transaction.Amount!.value}
                        currency={transaction.Amount!.currency}
                        style={styles.amount}
                        immutable
                    />
                </View>
            </>
        );
    }
}

export default ClawbackTemplate;
