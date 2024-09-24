import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { SetRegularKey } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: SetRegularKey;
}

export interface State {}

/* Component ==================================================================== */
class SetRegularKeyTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.regularKey')}
                    </Text>
                </View>

                {transaction.RegularKey ? (
                    <AccountElement
                        address={transaction.RegularKey}
                        containerStyle={[styles.contentBox, styles.addressContainer]}
                    />
                ) : (
                    <View style={styles.contentBox}>
                        <Text style={styles.value}>{Localize.t('global.empty')}</Text>
                    </View>
                )}
            </>
        );
    }
}

export default SetRegularKeyTemplate;
