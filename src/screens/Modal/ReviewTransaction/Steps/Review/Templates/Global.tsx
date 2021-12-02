import { isEmpty, find } from 'lodash';
import React, { Component } from 'react';
import { View, Text, Alert } from 'react-native';

import { StyleService, LedgerService } from '@services';

import { AppScreens } from '@common/constants';

import { Capitalize } from '@common/utils/string';
import { Navigator } from '@common/helpers/navigator';

import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';
import { Amount } from '@common/libs/ledger/parser/common';
import { TransactionsType } from '@common/libs/ledger/transactions/types';

// components
import { TouchableDebounce, Badge, Button, InfoMessage } from '@components/General';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface FeeItem {
    type: string;
    value: string;
    suggested?: boolean;
}

export interface Props {
    transaction: TransactionsType;
    canOverride: boolean;
    forceRender: () => void;
}

export interface State {
    availableFees: FeeItem[];
    selectedFee: FeeItem;
    isLoadingFee: boolean;
}

/* Component ==================================================================== */
class GlobalTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            availableFees: undefined,
            selectedFee: undefined,
            isLoadingFee: true,
        };
    }

    componentDidMount() {
        this.loadTransactionFee();
    }

    loadTransactionFee = async () => {
        const { transaction, canOverride } = this.props;

        try {
            // set the fee if not set and canOverride the details of transaction
            const shouldOverrideFee = typeof transaction.Fee === 'undefined' && canOverride;

            if (shouldOverrideFee) {
                // fetch current network fee

                // calculate and persist the transaction fees
                const { availableFees } = await LedgerService.getAvailableNetworkFee();

                // normalize suggested and available fees base on transaction type
                availableFees.reduce((fee: FeeItem) => {
                    return {
                        type: fee.type,
                        value: transaction.calculateFee(Number(fee.value)),
                    };
                });

                const suggestedFee = find(availableFees, { suggested: true });

                this.setState(
                    {
                        availableFees,
                        selectedFee: suggestedFee,
                    },
                    () => {
                        this.setTransactionFee(suggestedFee);
                    },
                );
            } else {
                this.setState({
                    selectedFee: {
                        type: 'unknown',
                        value: transaction.Fee,
                    },
                });
            }
        } catch {
            Alert.alert(Localize.t('global.error'), Localize.t('payload.unableToGetNetworkFee'));
        } finally {
            this.setState({
                isLoadingFee: false,
            });
        }
    };

    setTransactionFee = (fee: FeeItem) => {
        const { transaction } = this.props;

        // setting a transaction fee require xrp and not drops
        transaction.Fee = new Amount(fee.value).dropsToXrp();
    };

    onTransactionFeeSelect = (fee: FeeItem) => {
        this.setState(
            {
                selectedFee: fee,
            },
            () => {
                this.setTransactionFee(fee);
            },
        );
    };

    showFeeSelectOverlay = () => {
        const { transaction } = this.props;
        const { availableFees, selectedFee } = this.state;

        if (transaction.Type === 'AccountDelete') {
            return;
        }

        Navigator.showOverlay(AppScreens.Overlay.SelectFee, {
            availableFees,
            selectedFee,
            onSelect: this.onTransactionFeeSelect,
        });
    };

    getNormalizedFee = () => {
        const { selectedFee } = this.state;

        return new Amount(selectedFee.value).dropsToXrp();
    };

    getFeeColor = () => {
        const { transaction } = this.props;
        const { selectedFee } = this.state;

        if (transaction.Type === 'AccountDelete') {
            return StyleService.value('$textPrimary');
        }

        switch (selectedFee.type) {
            case 'low':
                return StyleService.value('$green');
            case 'medium':
                return StyleService.value('$orange');
            case 'high':
                return StyleService.value('$red');
            default:
                return StyleService.value('$textPrimary');
        }
    };

    renderFee = () => {
        const { isLoadingFee, selectedFee } = this.state;

        if (isLoadingFee || !selectedFee) {
            return (
                <>
                    <Text style={[styles.label]}>{Localize.t('global.fee')}</Text>
                    <View style={styles.contentBox}>
                        <Text style={[styles.value]}>Loading ...</Text>
                    </View>
                </>
            );
        }

        // fee is set by payload owner
        if (selectedFee.type === 'unknown') {
            return (
                <>
                    <Text style={[styles.label]}>{Localize.t('global.fee')}</Text>
                    <View style={styles.contentBox}>
                        <Text style={[styles.feeText]}>{selectedFee.value} XRP</Text>
                    </View>
                </>
            );
        }

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.fee')}</Text>
                <TouchableDebounce
                    activeOpacity={0.8}
                    style={[styles.contentBox, AppStyles.row]}
                    onPress={this.showFeeSelectOverlay}
                >
                    <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                        <Text style={[styles.feeText]}>{this.getNormalizedFee()} XRP</Text>
                        <Badge label={Capitalize(selectedFee.type)} size="medium" color={this.getFeeColor()} />
                    </View>
                    <Button
                        onPress={this.showFeeSelectOverlay}
                        style={styles.editButton}
                        roundedSmall
                        iconSize={13}
                        light
                        icon="IconEdit"
                    />
                </TouchableDebounce>
            </>
        );
    };

    renderWarnings = () => {
        const { transaction } = this.props;

        if (transaction.Type === 'AccountDelete') {
            return <InfoMessage type="error" label={Localize.t('payload.accountDeleteExchangeSupportWarning')} />;
        }

        return null;
    };

    renderFlags = () => {
        const { transaction } = this.props;

        if (!transaction.Flags) return null;

        const flags = [];
        for (const [key, value] of Object.entries(transaction.Flags)) {
            if (!(key in txFlags.Universal) && value) {
                flags.push(
                    <Text key={key} style={styles.value}>
                        {key}
                    </Text>,
                );
            }
        }

        if (isEmpty(flags)) {
            return null;
        }

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.flags')}</Text>
                <View style={[styles.contentBox]}>{flags}</View>
            </>
        );
    };

    renderMemos = () => {
        const { transaction } = this.props;

        if (!transaction.Memos) {
            return null;
        }

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.memo')}</Text>
                <View style={[styles.contentBox]}>
                    {transaction.Memos.map((m: any, index: number) => {
                        let memo = '';
                        memo += m.type ? `${m.type}\n` : '';
                        memo += m.format ? `${m.format}\n` : '';
                        memo += m.data ? `${m.data}` : '';
                        return (
                            <>
                                <Text key={`memo-${index}`} style={styles.value}>
                                    {memo}
                                </Text>
                            </>
                        );
                    })}
                </View>
            </>
        );
    };

    render() {
        return (
            <>
                {this.renderMemos()}
                {this.renderFlags()}
                {this.renderFee()}
                {this.renderWarnings()}
            </>
        );
    }
}

export default GlobalTemplate;
