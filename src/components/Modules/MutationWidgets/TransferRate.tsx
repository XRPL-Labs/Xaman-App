import BigNumber from 'bignumber.js';

import React, { PureComponent } from 'react';
import { InteractionManager, Text, View } from 'react-native';

import { TransactionTypes } from '@common/libs/ledger/types/enums';

import Localize from '@locale';

import styles from './styles';
/* Types ==================================================================== */
import { Props } from './types';

interface State {
    transferRatePercentage?: string;
}

/* Component ==================================================================== */
class TransferRate extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            transferRatePercentage: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.calculateTransferFee);
    }

    calculateTransferFee = () => {
        const { item } = this.props;

        // only for payments for now
        if (item.Type !== TransactionTypes.Payment) {
            return null;
        }

        if (item.Amount?.issuer && item.DeliveredAmount?.issuer) {
            const amountValue = new BigNumber(item.Amount.value);
            const deliveredValue = new BigNumber(item.DeliveredAmount.value);
            const issuerFee = amountValue.minus(deliveredValue);

            if (issuerFee.isGreaterThan(0)) {
                this.setState({
                    transferRatePercentage: issuerFee.dividedBy(amountValue).multipliedBy(100).toFixed(2, 0),
                });
            }
        }
    };

    render() {
        const { transferRatePercentage } = this.state;

        if (!transferRatePercentage) {
            return null;
        }

        return (
            <View style={styles.detailContainer}>
                <Text style={styles.detailsLabelText}>{Localize.t('global.transferFee')}</Text>
                <Text style={styles.detailsValueText}>
                    {Localize.t('events.transferRateMayApplied', {
                        transferRatePercentage: `${transferRatePercentage}%`,
                    })}
                </Text>
            </View>
        );
    }
}

export default TransferRate;
