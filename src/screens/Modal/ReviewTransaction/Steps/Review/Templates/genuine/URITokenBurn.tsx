import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { URITokenBurn } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: URITokenBurn;
}

export interface State {}

/* Component ==================================================================== */
class URITokenBurnTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.uriTokeId')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.URITokenID}</Text>
                </View>
            </>
        );
    }
}

export default URITokenBurnTemplate;
