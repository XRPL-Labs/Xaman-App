// import { get } from 'lodash';
import React, { Component } from 'react';
import {
    View,
    Text,
} from 'react-native';

import { CronSet } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
import { FormatDate } from '@common/utils/date';
import { InfoMessage } from '@components/General';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: CronSet;
}

export interface State {
}

/* Component ==================================================================== */
class CronSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
        };
    }

    render() {
        const { transaction } = this.props;

        return (
            <>
                {typeof transaction.Flags !== 'undefined' && transaction.Flags?.tfCronUnset === true && (
                    <InfoMessage
                        type="error"
                        label={Localize.t('cronSet.removeCron')}
                        containerStyle={AppStyles.marginBottomSml}
                    />
                )}

                {typeof transaction.Flags === 'undefined' || transaction.Flags?.tfCronUnset === false && (
                    <InfoMessage
                        type="info"
                        label={Localize.t('cronSet.setOrUpdate')}
                        containerStyle={AppStyles.marginBottomSml}
                    />
                )}
                
                {typeof transaction.StartTime !== 'undefined' && (
                    <>
                        <Text style={styles.label}>{Localize.t('cronSet.StartTime')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(String(transaction.StartTime))}</Text>
                        </View>
                    </>
                )}

                {typeof transaction.RepeatCount !== 'undefined' && (
                    <>
                        <Text style={styles.label}>{Localize.t('cronSet.RepeatCount')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.RepeatCount}</Text>
                        </View>
                    </>
                )}

                {typeof transaction.DelaySeconds !== 'undefined' && (
                    <>
                        <Text style={styles.label}>{Localize.t('cronSet.DelaySeconds')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.DelaySeconds}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default CronSetTemplate;
