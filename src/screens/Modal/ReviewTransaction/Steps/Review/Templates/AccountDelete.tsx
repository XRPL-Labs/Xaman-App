import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { AccountDelete } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { AccountElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: AccountDelete;
}

export interface State {}

/* Component ==================================================================== */
class AccountDeleteTemplate extends Component<Props, State> {
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
                        {Localize.t('global.to')}
                    </Text>
                </View>
                <AccountElement
                    address={transaction.Destination.address}
                    tag={transaction.Destination.tag}
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                />
            </>
        );
    }
}

export default AccountDeleteTemplate;
