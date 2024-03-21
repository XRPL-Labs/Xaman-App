import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { DepositPreauth } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: DepositPreauth;
}

export interface State {}

/* Component ==================================================================== */
class DepositPreauthTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.Authorize && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.authorize')}
                            </Text>
                        </View>

                        <AccountElement
                            address={transaction.Authorize}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {transaction.Unauthorize && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.unauthorize')}
                            </Text>
                        </View>

                        <AccountElement
                            address={transaction.Unauthorize}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}
            </>
        );
    }
}

export default DepositPreauthTemplate;
