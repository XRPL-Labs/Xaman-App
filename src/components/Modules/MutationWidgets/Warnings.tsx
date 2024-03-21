import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { LedgerEntryTypes } from '@common/libs/ledger/types/enums';

import { InfoMessage } from '@components/General';

import Localize from '@locale';

import styles from './styles';

import { Props } from './types';
/* Types ==================================================================== */
interface State {}

/* Component ==================================================================== */
class Warnings extends PureComponent<Props, State> {
    render() {
        const { item, account } = this.props;

        const warnings = [] as Array<string>;

        if (item.Type === LedgerEntryTypes.NFTokenOffer) {
            // incoming offer with destination set other than account
            if (item.Owner !== account.address && item.Destination && item.Destination !== account.address) {
                warnings.push(Localize.t('events.thisOfferCanOnlyBeAcceptedByThirdParty'));
            }
        }

        if (warnings.length > 0) {
            return (
                <View style={styles.warningsContainer}>
                    {warnings.map((warning, index) => {
                        return <InfoMessage key={`warning-${index}`} type="error" label={warning} />;
                    })}
                </View>
            );
        }

        return null;
    }
}

export default Warnings;
