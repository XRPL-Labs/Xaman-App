import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { OfferCancel } from '@common/libs/ledger/transactions';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: OfferCancel;
}

export interface State {}

/* Component ==================================================================== */
class TicketCreateTemplate extends Component<Props, State> {
    render() {
        const { transaction } = this.props;

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.ticketCount')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.TicketCount || 'NOT PRESENT'}</Text>
                </View>
            </>
        );
    }
}

export default TicketCreateTemplate;
