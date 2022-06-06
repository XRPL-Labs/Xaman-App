import { find, isEmpty, isUndefined } from 'lodash';
import React, { Component } from 'react';
import { Alert, Text, View } from 'react-native';

import { LedgerService, StyleService } from '@services';

import { AppScreens } from '@common/constants';

import { AccountNameType, getAccountName } from '@common/helpers/resolver';
import { Navigator } from '@common/helpers/navigator';

import { Capitalize } from '@common/utils/string';

import { TransactionTypes } from '@common/libs/ledger/types';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';
import { Amount } from '@common/libs/ledger/parser/common';
import { Transactions } from '@common/libs/ledger/transactions/types';

// components
import { Badge, Button, InfoMessage, LoadingIndicator, TouchableDebounce } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface FeeItem {
    type: string;
    value: number;
    suggested?: boolean;
}

export interface Props {
    transaction: Transactions;
    canOverride: boolean;
    forceRender: () => void;
}

export interface State {
    availableFees: FeeItem[];
    selectedFee: FeeItem;
    signers: AccountNameType[];
    isLoadingFee: boolean;
    isLoadingSigners: boolean;
}

/* Component ==================================================================== */
class GlobalTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            availableFees: undefined,
            selectedFee: undefined,
            signers: undefined,
            isLoadingFee: true,
            isLoadingSigners: true,
        };
    }

    componentDidMount() {
        this.loadTransactionFee();
        this.fetchSignersDetails();
    }

    fetchSignersDetails = async () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.Signers)) {
            this.setState({
                isLoadingSigners: false,
            });
            return;
        }

        const signers = [] as any;

        await Promise.all(
            transaction.Signers.map(async (signer) => {
                await getAccountName(signer.account)
                    .then((res) => {
                        signers.push(res);
                    })
                    .catch(() => {
                        signers.push({ account: signer.Account });
                    });

                return signers;
            }),
        );

        this.setState({
            signers,
            isLoadingSigners: false,
        });
    };

    loadTransactionFee = async () => {
        const { transaction, canOverride } = this.props;

        try {
            // set the fee if not set and canOverride the details of transaction
            const shouldOverrideFee = typeof transaction.Fee === 'undefined' && canOverride;

            if (shouldOverrideFee) {
                // calculate and persist the transaction fees
                let { availableFees } = await LedgerService.getAvailableNetworkFee();

                // normalize suggested and available fees base on transaction type
                availableFees = availableFees.map((fee: FeeItem) => {
                    return {
                        type: fee.type,
                        value: transaction.calculateFee(fee.value),
                        suggested: fee.suggested,
                    };
                });

                // get suggested fee
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
                        value: Number(transaction.Fee),
                    },
                });
            }
        } catch (e) {
            Alert.alert(Localize.t('global.error'), Localize.t('payload.unableToGetNetworkFee'));
        } finally {
            this.setState({
                isLoadingFee: false,
            });
        }
    };

    setTransactionFee = (fee: FeeItem) => {
        const { transaction } = this.props;

        // NOTE: setting the transaction fee require XRP and not drops
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
        const { availableFees, selectedFee } = this.state;

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
        const { selectedFee } = this.state;

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
        const { transaction } = this.props;
        const { isLoadingFee, selectedFee } = this.state;

        // we are loading the fee
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

        // fee is set by payload as it's already transformed to XRP from drops
        // we show it as it is
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

        // AccountDelete transaction have fixed fee value
        // NOTE: this may change in future, we may need to let user to select higher fees
        if (transaction.Type === TransactionTypes.AccountDelete) {
            return (
                <>
                    <Text style={[styles.label]}>{Localize.t('global.fee')}</Text>
                    <View style={styles.contentBox}>
                        <Text style={[styles.feeText]}>{this.getNormalizedFee()} XRP</Text>
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

        if (transaction.Type === TransactionTypes.AccountDelete) {
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

    renderSigners = () => {
        const { transaction } = this.props;
        const { signers, isLoadingSigners } = this.state;

        if (isEmpty(transaction.Signers)) {
            return null;
        }

        if (isLoadingSigners || !signers) {
            return <LoadingIndicator />;
        }

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.signers')}</Text>
                <View style={styles.signersContainer}>
                    {signers.map((signer) => {
                        return <RecipientElement key={`${signer.address}`} recipient={signer} />;
                    })}
                </View>
            </>
        );
    };

    renderSequence = () => {
        const { transaction } = this.props;

        if (isUndefined(transaction.Sequence)) {
            return null;
        }

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.sequence')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.Sequence}</Text>
                </View>
            </>
        );
    };

    renderTicketSequence = () => {
        const { transaction } = this.props;

        if (isUndefined(transaction.TicketSequence)) {
            return null;
        }

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.ticketSequence')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.TicketSequence}</Text>
                </View>
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
                            <Text key={`memo-${index}`} style={styles.value}>
                                {memo}
                            </Text>
                        );
                    })}
                </View>
            </>
        );
    };

    render() {
        return (
            <>
                {this.renderTicketSequence()}
                {this.renderSequence()}
                {this.renderSigners()}
                {this.renderMemos()}
                {this.renderFlags()}
                {this.renderFee()}
                {this.renderWarnings()}
            </>
        );
    }
}

export default GlobalTemplate;
