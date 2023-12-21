import React, { Component } from 'react';
import { View, Text } from 'react-native';

import Localize from '@locale';

import { ClaimReward } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: ClaimReward;
}

export interface State {}

/* Component ==================================================================== */
class ClaimRewardTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        // nothing to show
        if (!transaction.Issuer) {
            return null;
        }

        return (
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
        );
    }
}

export default ClaimRewardTemplate;
