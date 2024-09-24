import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import styles from './styles';
import Localize from '@locale';

/* Types ==================================================================== */
import { Props } from './types';

/* Component ==================================================================== */
class InvoiceId extends PureComponent<Props> {
    render() {
        const { item } = this.props;

        if (!('InvoiceID' in item) || typeof item.InvoiceID === 'undefined') {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.detailsLabelText}>{Localize.t('global.invoiceID')}</Text>
                <Text selectable style={styles.hashText}>
                    {item.InvoiceID}
                </Text>
            </View>
        );
    }
}

export default InvoiceId;
