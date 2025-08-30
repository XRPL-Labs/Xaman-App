import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { CredentialAccept } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
import { HexEncoding } from '@common/utils/string';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: CredentialAccept;
}

export interface State {}

/* Component ==================================================================== */
class CredentialAcceptTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
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
                            <Text style={styles.value}>{HexEncoding.displayHex(transaction.CredentialType)}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CredentialAcceptTemplate;
