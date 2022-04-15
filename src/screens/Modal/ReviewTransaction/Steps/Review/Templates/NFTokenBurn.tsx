/* eslint-disable react/jsx-one-expression-per-line */

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenBurn } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import styles from './styles';
/* types ==================================================================== */
export interface Props {
    transaction: NFTokenBurn;
}

export interface State {}

/* Component ==================================================================== */
class NFTokenBurnTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.tokenID')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{transaction.NFTokenID}</Text>
                </View>
            </>
        );
    }
}

export default NFTokenBurnTemplate;
