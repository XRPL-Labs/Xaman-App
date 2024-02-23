import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Invoke } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Invoke;
}

export interface State {}

/* Component ==================================================================== */
class EscrowCreateTemplate extends Component<Props, State> {
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

                {!isEmpty(transaction.InvoiceID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.invoiceID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.valueSubtext}>{transaction.InvoiceID}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default EscrowCreateTemplate;
