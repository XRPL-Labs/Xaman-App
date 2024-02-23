import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { BaseTransaction } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import styles from './styles';

import { Props } from './types';

/* Types ==================================================================== */

interface State {}

/* Component ==================================================================== */
class Fee extends PureComponent<Props, State> {
    render() {
        const { item } = this.props;

        // ledger objects doesn't contain fee
        if (!(item instanceof BaseTransaction)) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.detailsLabelText}>{Localize.t('events.transactionCost')}</Text>
                <Text style={styles.detailsValueText}>
                    {Localize.t('events.sendingThisTransactionConsumed', {
                        fee: item.Fee!.value,
                        nativeAsset: item.Fee!.currency,
                    })}
                </Text>
            </View>
        );
    }
}

export default Fee;
