import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { CredentialCreate } from '@common/libs/ledger/transactions';

import { ReadMore } from '@components/General';
import { AccountElement } from '@components/Modules';

import { FormatDate } from '@common/utils/date';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: CredentialCreate;
}

export interface State {}

/* Component ==================================================================== */
class CredentialCreateTemplate extends Component<Props, State> {
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

                {transaction.CredentialType && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.credentialType')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.CredentialType}</Text>
                        </View>
                    </>
                )}

                {transaction.URI && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.uri')}</Text>
                        <View style={styles.contentBox}>
                            <ReadMore numberOfLines={3} textStyle={styles.value}>
                                {transaction.URI}
                            </ReadMore>
                        </View>
                    </>
                )}

                {transaction.Expiration && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.expireAfter')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(transaction.Expiration)}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CredentialCreateTemplate;
