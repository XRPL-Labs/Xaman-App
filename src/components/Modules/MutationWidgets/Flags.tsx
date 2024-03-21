import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';

import Localize from '@locale';

import styles from './styles';

/* Types ==================================================================== */
import { Props } from './types';

/* Component ==================================================================== */
class Flags extends PureComponent<Props> {
    render() {
        const { item } = this.props;

        if (typeof item.Flags === 'undefined' || Object.keys(item.Flags).length === 0) {
            return null;
        }

        const flags = [];
        for (const [key, value] of Object.entries(item.Flags)) {
            if (!(key in txFlags.Universal) && value) {
                flags.push(
                    <Text key={key} style={styles.detailsValueText}>
                        {key}
                    </Text>,
                );
            }
        }

        if (flags.length === 0) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.detailsLabelText}>{Localize.t('global.flags')}</Text>
                {flags}
            </View>
        );
    }
}

export default Flags;
