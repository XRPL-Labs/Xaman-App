import moment from 'moment-timezone';

import React, { PureComponent } from 'react';
import { Text, View } from 'react-native';

import { InstanceTypes } from '@common/libs/ledger/types/enums';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { Props } from './types';

/* Component ==================================================================== */
class ValidatedLedger extends PureComponent<Props> {
    render() {
        const { item } = this.props;

        if (
            item.InstanceType !== InstanceTypes.GenuineTransaction &&
            item.InstanceType !== InstanceTypes.FallbackTransaction
        ) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.detailsLabelText}>{Localize.t('global.status')}</Text>
                <Text style={styles.detailsValueText}>
                    {Localize.t('events.thisTransactionWasSuccessful')} {Localize.t('events.andValidatedInLedger')}
                    <Text style={AppStyles.monoBold}> {item.LedgerIndex} </Text>
                    {Localize.t('events.onDate')}
                    <Text style={AppStyles.bold}> {moment(item.Date).format('LLLL')}</Text>
                </Text>
            </View>
        );
    }
}

export default ValidatedLedger;
