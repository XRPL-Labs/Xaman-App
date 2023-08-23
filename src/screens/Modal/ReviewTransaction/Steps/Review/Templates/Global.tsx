import { find, isEmpty, isUndefined } from 'lodash';
import React, { Component } from 'react';
import { Alert, Text, View } from 'react-native';

import { NetworkService, StyleService } from '@services';

import { AppScreens } from '@common/constants';

import { AccountNameType, getAccountName } from '@common/helpers/resolver';
import { Navigator } from '@common/helpers/navigator';

import { Capitalize } from '@common/utils/string';

import { Transactions } from '@common/libs/ledger/transactions/types';

import { TransactionTypes } from '@common/libs/ledger/types';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';
import { Amount } from '@common/libs/ledger/parser/common';

import { AccountRepository } from '@store/repositories';

// components
import { Badge, Button, InfoMessage, LoadingIndicator, TouchableDebounce } from '@components/General';
import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Transactions;
}
export interface State {
    availableFees: FeeItem[];
    selectedFee: FeeItem;
    signers: AccountNameType[];
    warnings: Array<string>;
    isLoadingFee: boolean;
    isLoadingSigners: boolean;
}

export interface FeeItem {
    type: string;
    value: number;
}

/* Component ==================================================================== */
class GlobalTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            availableFees: undefined,
            selectedFee: undefined,
            signers: undefined,
            warnings: undefined,
            isLoadingFee: true,
            isLoadingSigners: true,
        };
    }

    componentDidMount() {
        this.loadTransactionFee();
        this.fetchSignersDetails();
        this.setWarnings();
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
        const { transaction, payload } = this.props;

        try {
            // set the fee if not set and can override the details of transaction
            const shouldOverrideFee = typeof transaction.Fee === 'undefined' && !payload.isMultiSign();

            if (shouldOverrideFee) {
                // calculate and persist the transaction fees
                const { availableFees, suggested } = await NetworkService.getAvailableNetworkFee(transaction.Json);

                // normalize suggested and available fees base on transaction type
                const availableFeesNormalized = availableFees.map((fee: FeeItem) => {
                    return {
                        type: fee.type,
                        value: transaction.calculateFee(fee.value),
                    };
                });

                // get suggested fee
                const suggestedFee = find(availableFeesNormalized, { type: suggested });

                this.setState(
                    {
                        availableFees: availableFeesNormalized,
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

    setWarnings = async () => {
        const { transaction } = this.props;

        const warnings = [];

        // AccountDelete
        // check if destination account is already imported in XUMM and can be signed
        if (transaction.Type === TransactionTypes.AccountDelete) {
            if (!find(AccountRepository.getSignableAccounts(), (o) => o.address === transaction.Destination?.address)) {
                warnings.push(Localize.t('payload.accountDeleteExchangeSupportWarning'));
            }
        }

        if (warnings.length > 0) {
            this.setState({
                warnings,
            });
        }
    };

    setTransactionFee = (fee: FeeItem) => {
        const { transaction } = this.props;

        // NOTE: setting the transaction fee require Native and not drops
        transaction.Fee = new Amount(fee.value).dropsToNative();
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

        return new Amount(selectedFee.value).dropsToNative();
    };

    getFeeColor = () => {
        const { selectedFee } = this.state;

        switch (selectedFee.type) {
            case 'LOW':
                return StyleService.value('$green');
            case 'MEDIUM':
                return StyleService.value('$orange');
            case 'HIGH':
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
                    <Text style={styles.label}>{Localize.t('global.fee')}</Text>
                    <View style={styles.contentBox}>
                        <Text style={styles.value}>Loading ...</Text>
                    </View>
                </>
            );
        }

        // fee is set by payload as it's already transformed to Native from drops
        // we show it as it is
        if (selectedFee.type === 'unknown') {
            return (
                <>
                    <Text style={styles.label}>{Localize.t('global.fee')}</Text>
                    <View style={styles.contentBox}>
                        <Text style={styles.feeText}>
                            {selectedFee.value} {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </>
            );
        }

        // AccountDelete transaction have fixed fee value
        // NOTE: this may change in the future, we may need to let user select higher fees
        if (transaction.Type === TransactionTypes.AccountDelete) {
            return (
                <>
                    <Text style={styles.label}>{Localize.t('global.fee')}</Text>
                    <View style={styles.contentBox}>
                        <Text style={styles.feeText}>
                            {this.getNormalizedFee()} {NetworkService.getNativeAsset()}
                        </Text>
                    </View>
                </>
            );
        }

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.fee')}</Text>
                <TouchableDebounce
                    activeOpacity={0.8}
                    style={[styles.contentBox, AppStyles.row]}
                    onPress={this.showFeeSelectOverlay}
                >
                    <View style={[AppStyles.flex1, AppStyles.row, AppStyles.centerAligned]}>
                        <Text style={styles.feeText}>
                            {this.getNormalizedFee()} {NetworkService.getNativeAsset()}
                        </Text>
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
        const { warnings } = this.state;

        if (Array.isArray(warnings) && warnings.length > 0) {
            return warnings.map((warning, index) => {
                return <InfoMessage key={index} type="error" label={warning} />;
            });
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
                <Text style={styles.label}>{Localize.t('global.flags')}</Text>
                <View style={styles.contentBox}>{flags}</View>
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
                <Text style={styles.label}>{Localize.t('global.signers')}</Text>
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
                <Text style={styles.label}>{Localize.t('global.sequence')}</Text>
                <View style={styles.contentBox}>
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
                <Text style={styles.label}>{Localize.t('global.ticketSequence')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.TicketSequence}</Text>
                </View>
            </>
        );
    };

    renderNetworkId = () => {
        const { transaction } = this.props;

        if (isUndefined(transaction.NetworkID)) {
            return null;
        }

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.networkId')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.NetworkID}</Text>
                </View>
            </>
        );
    };

    renderHookParameters = () => {
        const { transaction } = this.props;

        if (isUndefined(transaction.HookParameters)) {
            return null;
        }

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.hookParameters')}</Text>
                <View style={styles.contentBox}>
                    {transaction.HookParameters.map((parameter, index: number) => {
                        const { HookParameter } = parameter;

                        return (
                            <View key={`hook-parameter-${index}`} style={[]}>
                                <Text style={styles.value}>
                                    <Text style={styles.hookParamText}>{HookParameter.HookParameterName}</Text>
                                    &nbsp;:&nbsp;
                                    <Text style={styles.hookParamText}>{HookParameter.HookParameterValue}</Text>
                                </Text>
                            </View>
                        );
                    })}
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
                <Text style={styles.label}>{Localize.t('global.memo')}</Text>
                <View style={styles.contentBox}>
                    {transaction.Memos.map((m, index: number) => {
                        let memo = '';
                        memo += m.MemoType ? `${m.MemoType}\n` : '';
                        memo += m.MemoFormat ? `${m.MemoFormat}\n` : '';
                        memo += m.MemoData ? `${m.MemoData}` : '';
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
                {this.renderHookParameters()}
                {this.renderNetworkId()}
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
