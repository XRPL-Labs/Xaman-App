import { isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { OfferCancel } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: OfferCancel;
}

export interface State {
    isLoading: boolean;
}

/* Component ==================================================================== */
class OfferCancelTemplate extends Component<Props, State> {
    render() {
        const { transaction } = this.props;

        return (
            <>
                {!isUndefined(transaction.OfferID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.offerID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.OfferID}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.OfferSequence) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.offerSequence')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.OfferSequence}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default OfferCancelTemplate;
