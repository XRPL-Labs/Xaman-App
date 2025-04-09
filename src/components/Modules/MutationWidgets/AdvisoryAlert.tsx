import React, { PureComponent } from 'react';
import { View, Text } from 'react-native';

import ContactRepository from '@store/repositories/contact';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* Types ==================================================================== */
import { Props } from './types';

/* Component ==================================================================== */
class AdvisoryAlert extends PureComponent<Props> {
    
    render() {
        const { advisory, account, item } = this.props;

        if (item && item?.Account && item.Account !== account.address) {
            if (ContactRepository.findOne({ address: item.Account, destinationTag: '' })) {
                // No advisory if in contacts
                return null;
            }
        }

        if (!advisory || advisory === 'UNKNOWN') {
            return null;
        }

        return (
            <View style={styles.advisoryContainer}>
                <Text style={[AppStyles.h4, AppStyles.colorWhite]}>{Localize.t('global.alertDanger')}</Text>
                <Text style={[AppStyles.subtext, AppStyles.textCenterAligned, AppStyles.colorWhite]}>
                    {Localize.t('global.thisAccountIsReportedAsScamOrFraudulentAddressPleaseProceedWithCaution')}
                </Text>
            </View>
        );
    }
}

export default AdvisoryAlert;
