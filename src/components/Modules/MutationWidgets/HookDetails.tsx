import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import { BaseLedgerObject } from '@common/libs/ledger/objects';
import { TransactionTypes } from '@common/libs/ledger/types/enums';

import HooksExplainer from '@components/Modules/HooksExplainer/HooksExplainer';

import Localize from '@locale';

import styles from './styles';

/* Types ==================================================================== */
import { Props } from './types';

/* Component ==================================================================== */
class HookDetails extends PureComponent<Props> {
    render() {
        const { item, account } = this.props;

        // we don't need to load hooks explainer for ledger objects
        if (item instanceof BaseLedgerObject) {
            return null;
        }

        if (
            item.Type === TransactionTypes.SetHook ||
            item.EmitDetails ||
            item.MetaData?.HookExecutions ||
            item.MetaData?.HookEmissions
        ) {
            return (
                <View style={styles.detailContainer}>
                    <Text style={styles.detailsLabelText}>{Localize.t('global.hooks')}</Text>
                    <HooksExplainer transaction={item} account={account} />
                </View>
            );
        }

        return null;
    }
}

export default HookDetails;
