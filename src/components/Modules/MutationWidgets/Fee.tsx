import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import Localize from '@locale';

import { InstanceTypes } from '@common/libs/ledger/types/enums';

import styles from './styles';
/* Types ==================================================================== */
import { Props } from './types';

interface State {}

/* Component ==================================================================== */
class Fee extends PureComponent<Props, State> {
    render() {
        const { item } = this.props;

        // ledger objects / synthetic outputs (e.g. Remit) don't contain a fee
        if (
            InstanceTypes.GenuineTransaction !== item.InstanceType &&
            InstanceTypes.FallbackTransaction !== item.InstanceType
        ) {
            return null;
        }

        if (!item.Fee) {
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
