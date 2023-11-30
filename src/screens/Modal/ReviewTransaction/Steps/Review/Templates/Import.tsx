import React, { Component } from 'react';
import { View, Text } from 'react-native';

import Localize from '@locale';

import { Import } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from './types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Import;
}

export interface State {}

/* Component ==================================================================== */
class ImportTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.Blob && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.blob')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.Blob}</Text>
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
            </>
        );
    }
}

export default ImportTemplate;
