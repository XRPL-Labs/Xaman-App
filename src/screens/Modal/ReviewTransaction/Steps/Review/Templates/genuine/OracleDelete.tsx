import { isUndefined } from 'lodash';

import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { OracleDelete } from '@common/libs/ledger/transactions';

import { InfoMessage } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: OracleDelete;
}

export interface State {}

/* Component ==================================================================== */
class OracleDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <View style={styles.contentBox}>
                {!isUndefined(transaction.OracleDocumentID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.oracleDocumentID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>
                                {transaction.OracleDocumentID ?? Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}
                <InfoMessage
                    type="warning"
                    label={Localize.t('payload.oracleDeleteWarning')}
                    containerStyle={AppStyles.marginVerticalSml}
                />
            </View>
        );
    }
}

export default OracleDeleteTemplate;
