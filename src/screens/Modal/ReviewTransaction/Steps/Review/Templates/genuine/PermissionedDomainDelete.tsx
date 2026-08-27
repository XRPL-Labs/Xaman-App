import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { PermissionedDomainDelete } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: PermissionedDomainDelete;
}

export interface State {}

/* Component ==================================================================== */
class PermissionedDomainDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <View>
                {transaction.DomainID && (
                    <>
                        <Text style={styles.label}>{Localize.t('permissionedDomain.domainId')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.DomainID}</Text>
                        </View>
                    </>
                )}
            </View>
        );
    }
}

export default PermissionedDomainDeleteTemplate;
