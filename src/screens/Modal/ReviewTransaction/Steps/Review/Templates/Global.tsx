import { find, isEmpty, isUndefined } from 'lodash';
import React, { Component } from 'react';
import { Text, View } from 'react-native';

import { AccountNameType, getAccountName } from '@common/helpers/resolver';

import { Transactions } from '@common/libs/ledger/transactions/types';

import { TransactionTypes } from '@common/libs/ledger/types';
import { txFlags } from '@common/libs/ledger/parser/common/flags/txFlags';
import { Amount } from '@common/libs/ledger/parser/common';

import NetworkService from '@services/NetworkService';

import { AccountRepository } from '@store/repositories';

// components
import { InfoMessage, LoadingIndicator } from '@components/General';
import { FeePicker, RecipientElement } from '@components/Modules';

import Localize from '@locale';

import styles from './styles';

import { TemplateProps } from './types';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Transactions;
}
export interface State {
    signers: AccountNameType[];
    warnings: Array<string>;
    isLoadingSigners: boolean;
    showFeePicker: boolean;
}

/* Component ==================================================================== */
class GlobalTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            signers: undefined,
            warnings: undefined,
            isLoadingSigners: true,
            showFeePicker: typeof props.transaction.Fee === 'undefined' && !props.payload.isMultiSign(),
        };
    }

    componentDidMount() {
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

    setTransactionFee = (fee: any) => {
        const { transaction } = this.props;

        // NOTE: setting the transaction fee require Native and not drops
        transaction.Fee = new Amount(fee.value).dropsToNative();
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
                            <View key={`hook-parameter-${index}`}>
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

    renderFee = () => {
        const { transaction } = this.props;
        const { showFeePicker } = this.state;

        // we should not override the fee
        // either transaction fee has already been set in payload
        // or transaction is a multi sign tx
        if (!showFeePicker) {
            if (typeof transaction.Fee !== 'undefined') {
                return (
                    <>
                        <Text style={styles.label}>{Localize.t('global.fee')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.feeText}>
                                {transaction.Fee} {NetworkService.getNativeAsset()}
                            </Text>
                        </View>
                    </>
                );
            }

            return null;
        }

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.fee')}</Text>
                <FeePicker
                    txJson={transaction.Json}
                    onSelect={this.setTransactionFee}
                    containerStyle={styles.contentBox}
                    textStyle={styles.feeText}
                />
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
