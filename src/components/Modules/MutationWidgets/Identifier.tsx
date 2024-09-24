import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { BaseLedgerObject } from '@common/libs/ledger/objects';

import styles from './styles';
import Localize from '@locale';

/* Types ==================================================================== */
import { Props } from './types';

/* Component ==================================================================== */
class Identifier extends PureComponent<Props> {
    render() {
        const { item } = this.props;

        if (item instanceof BaseLedgerObject) {
            return (
                <View style={styles.detailContainer}>
                    <Text style={styles.detailsLabelText}>{Localize.t('events.ledgerIndex')}</Text>
                    <Text selectable style={styles.hashText}>
                        {item.Index}
                    </Text>
                </View>
            );
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.detailsLabelText}>{Localize.t('events.transactionId')}</Text>
                <Text selectable style={styles.hashText}>
                    {item.hash}
                </Text>
            </View>
        );
    }
}

export default Identifier;
