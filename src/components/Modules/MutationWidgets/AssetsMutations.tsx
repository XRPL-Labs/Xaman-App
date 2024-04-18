import React, { PureComponent } from 'react';
import { View } from 'react-native';

import { AmountText, Icon } from '@components/General';

import { BalanceChangeType, OperationActions } from '@common/libs/ledger/parser/types';

import { AppStyles } from '@theme';
import styles from './styles';

import { Props } from './types';

/* Types ==================================================================== */
interface State {
    sentAssets?: BalanceChangeType[];
    receivedAssets?: BalanceChangeType[];
}

/* Component ==================================================================== */
class AssetsMutations extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            sentAssets: undefined,
            receivedAssets: undefined,
        };
    }

    static getDerivedStateFromProps(props: Props): Partial<State> | null {
        if (props.explainer) {
            const monetaryDetails = props.explainer.getMonetaryDetails();
            return {
                sentAssets: monetaryDetails?.mutate[OperationActions.DEC],
                receivedAssets: monetaryDetails?.mutate[OperationActions.INC],
            };
        }

        return null;
    }

    renderSentAssets = () => {
        const { sentAssets } = this.state;

        if (sentAssets && sentAssets.length > 0) {
            return (
                <View style={styles.amountGroupContainer}>
                    {sentAssets.map((asset, index) => {
                        return (
                            <View key={`${asset.action}-${index}`} style={styles.amountContainer}>
                                <Icon
                                    name="IconCornerLeftUp"
                                    size={22}
                                    style={[{ tintColor: styles.outgoingColor.tintColor }, AppStyles.marginRightSml]}
                                />
                                <AmountText
                                    value={asset.value}
                                    currency={asset.currency}
                                    prefix="-"
                                    style={[styles.amountText, { color: styles.outgoingColor.color }]}
                                />
                            </View>
                        );
                    })}
                </View>
            );
        }

        return null;
    };

    renderReceivedAssets = () => {
        const { receivedAssets } = this.state;

        if (receivedAssets && receivedAssets.length > 0) {
            return (
                <View style={styles.amountGroupContainer}>
                    {receivedAssets.map((asset, index) => {
                        return (
                            <View key={`${asset.action}-${index}`} style={styles.amountContainer}>
                                <Icon
                                    name="IconCornerRightDown"
                                    size={22}
                                    style={[{ tintColor: styles.incomingColor.tintColor }, AppStyles.marginRightSml]}
                                />
                                <AmountText
                                    value={asset.value}
                                    currency={asset.currency}
                                    style={[styles.amountText, { color: styles.incomingColor.color }]}
                                />
                            </View>
                        );
                    })}
                </View>
            );
        }

        return null;
    };

    renderIcon = () => {
        const { sentAssets, receivedAssets } = this.state;

        if (sentAssets && sentAssets.length > 0 && receivedAssets && receivedAssets?.length > 0) {
            return (
                <Icon
                    size={22}
                    style={[AppStyles.imgColorGrey, AppStyles.paddingVerticalSml]}
                    name="IconSwitchAccount"
                />
            );
        }

        return null;
    };

    render() {
        return (
            <View style={styles.itemContainer}>
                {this.renderSentAssets()}
                {this.renderIcon()}
                {this.renderReceivedAssets()}
            </View>
        );
    }
}

export default AssetsMutations;
