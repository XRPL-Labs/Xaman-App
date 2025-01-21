import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { CredentialDelete } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: CredentialDelete;
}

export interface State {}

/* Component ==================================================================== */
class CredentialDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {transaction.Subject && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.subject')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Subject}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
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

                {transaction.CredentialType && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.credentialType')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.CredentialType}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CredentialDeleteTemplate;
