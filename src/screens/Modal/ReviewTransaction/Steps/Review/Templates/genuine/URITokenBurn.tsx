import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { URITokenElement } from '@components/Modules';

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
                <Text style={styles.label}>{Localize.t('global.uritoken')}</Text>
                <View style={styles.contentBox}>
                    <URITokenElement
                        uriTokenId={transaction!.URITokenID}
                        truncate={false}
                        containerStyle={styles.uriTokenContainer}
                    />
                </View>
            </>
        );
    }
}

export default URITokenBurnTemplate;
