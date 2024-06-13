import React, { Component } from 'react';
import { View } from 'react-native';

import { DIDDelete } from '@common/libs/ledger/transactions';

import { InfoMessage } from '@components/General';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: DIDDelete;
}

export interface State {}

/* Component ==================================================================== */
class DIDDeleteTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    render() {
        return (
            <View style={styles.contentBox}>
                <InfoMessage type="warning" label={Localize.t('payload.didDeleteWarning')} />
            </View>
        );
    }
}

export default DIDDeleteTemplate;
