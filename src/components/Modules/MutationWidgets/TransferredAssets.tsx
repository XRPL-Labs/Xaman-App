import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { AmountText, Icon } from '@components/General';

import { AppStyles } from '@theme';
import styles from './styles';

import { Props } from './types';
import { InstanceTypes } from '@common/libs/ledger/types/enums';

/* Types ==================================================================== */
interface State {}

/* Component ==================================================================== */
class TransferredAssets extends PureComponent<Props, State> {
    renderSent = () => {
        const { item, account } = this.props;

        // TODO: return factor instead
        if (item.InstanceType === InstanceTypes.LedgerObject) {
            return null;
        }

        const sentValue = item.BalanceChange(account.address)?.sent;

        if (sentValue) {
            return (
                <View style={styles.amountContainer}>
                    <Icon
                        name="IconCornerLeftUp"
                        size={27}
                        style={[{ tintColor: styles.outgoingColor.tintColor }, AppStyles.marginRightSml]}
                    />
                    <AmountText
                        value={sentValue.value}
                        currency={sentValue.currency}
                        prefix="-"
                        style={[styles.amountText, { color: styles.outgoingColor.color }]}
                    />
                </View>
            );
        }

        return null;
    };

    renderReceived = () => {
        const { item, account } = this.props;

        // TODO: return factor instead
        if (item.InstanceType === InstanceTypes.LedgerObject) {
            return null;
        }

        const receivedValue = item.BalanceChange(account.address)?.received;

        if (receivedValue) {
            return (
                <View style={styles.amountContainer}>
                    <Icon
                        name="IconCornerRightDown"
                        size={27}
                        style={[{ tintColor: styles.incomingColor.tintColor }, AppStyles.marginRightSml]}
                    />
                    <AmountText
                        value={receivedValue.value}
                        currency={receivedValue.currency}
                        style={[styles.amountText, { color: styles.incomingColor.color }]}
                    />
                </View>
            );
        }

        return null;
    };

    render() {
        return (
            <View style={styles.itemContainer}>
                {this.renderSent()}
                {this.renderReceived()}
            </View>
        );
    }
}

export default TransferredAssets;
