import { find, isEmpty, isUndefined } from 'lodash';
import React, { Component } from 'react';
import { InteractionManager, Text, View } from 'react-native';

import { Transactions } from '@common/libs/ledger/transactions/types';

import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { AmountParser } from '@common/libs/ledger/parser/common';

import NetworkService from '@services/NetworkService';

import { AccountRepository } from '@store/repositories';

import { InfoMessage, ReadMore } from '@components/General';
import { FeePicker, ServiceFee, AccountElement, HooksExplainer } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
import { HookExplainerOrigin } from '@components/Modules/HooksExplainer/HooksExplainer';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Transactions;
    setServiceFee: (serviceFee: number) => void;
}
export interface State {
    warnings?: Array<string>;
    showFeePicker: boolean;
}

/* Component ==================================================================== */
class GlobalTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            warnings: undefined,
            showFeePicker: typeof props.transaction.Fee === 'undefined' && !props.payload.isMultiSign(),
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.setWarnings);
    }

    setWarnings = async () => {
        const { transaction } = this.props;

        const warnings = [];

        // AccountDelete
        // check if destination account is already imported in XUMM and can be signed
        if (transaction.Type === TransactionTypes.AccountDelete) {
            if (!find(AccountRepository.getSignableAccounts(), (o) => o.address === transaction.Destination)) {
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

        // NOTE: setting the transaction fee require Native and not Drops
        transaction.Fee = {
            currency: NetworkService.getNativeAsset(),
            value: new AmountParser(fee.value).dropsToNative().toString(),
        };
    };

    setServiceFeeAmount = (fee: any) => {
        const { setServiceFee } = this.props;
        setServiceFee(Number(fee?.value || 0));
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
            if (value) {
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

        if (isEmpty(transaction.Signers)) {
            return null;
        }

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.signers')}</Text>
                <View style={styles.signersContainer}>
                    {transaction.Signers?.map((signer) => {
                        return <AccountElement key={`${signer.account}`} address={signer.account} />;
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

    renderOperationLimit = () => {
        const { transaction } = this.props;

        if (isUndefined(transaction.OperationLimit)) {
            return null;
        }

        return (
            <>
                <Text style={styles.label}>{Localize.t('global.operationLimit')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{transaction.OperationLimit}</Text>
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
                        return (
                            <View key={`hook-parameter-${index}`}>
                                <Text style={styles.value}>
                                    <Text style={styles.hookParamText}>{parameter.HookParameterName}</Text>
                                    &nbsp;:&nbsp;
                                    <Text style={styles.hookParamText}>{parameter.HookParameterValue}</Text>
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
                    <ReadMore numberOfLines={3} textStyle={styles.value}>
                        {transaction.Memos.map((m) => {
                            let memo = '';
                            memo += m.MemoType ? `${m.MemoType}\n` : '';
                            memo += m.MemoFormat ? `${m.MemoFormat}\n` : '';
                            memo += m.MemoData ? `${m.MemoData}` : '';
                            return memo;
                        })}
                    </ReadMore>
                </View>
            </>
        );
    };

    renderHookExplainer = () => {
        const { transaction, source } = this.props;

        // check if hooks is enabled in the current network
        const network = NetworkService.getNetwork();

        // only show if Hooks amendment is active on the network
        // hide for SetHook transactions as we show the explainer in the beginning of the screen on top, no duplicate!!!
        if (network?.isFeatureEnabled('Hooks') && transaction.Type !== TransactionTypes.SetHook) {
            return (
                <>
                    <Text style={styles.label}>{Localize.t('global.hooks')}</Text>
                    <View style={styles.contentBox}>
                        <HooksExplainer
                            transaction={transaction}
                            account={source}
                            origin={HookExplainerOrigin.ReviewPayload}
                        />
                    </View>
                </>
            );
        }

        return null;
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
                                {transaction.Fee.value} {NetworkService.getNativeAsset()}
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
                    txJson={transaction.JsonForSigning}
                    onSelect={this.setTransactionFee}
                    containerStyle={styles.contentBox}
                    textStyle={styles.feeText}
                />
            </>
        );
    };

    renderServiceFee = () => {
        const { transaction } = this.props;
        // const { showFeePicker } = this.state;

        return (
            <>
                <Text style={styles.label}>Service fee</Text>
                <ServiceFee
                    txJson={transaction.JsonForSigning}
                    onSelect={this.setServiceFeeAmount}
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
                {this.renderOperationLimit()}
                {this.renderTicketSequence()}
                {this.renderSequence()}
                {this.renderSigners()}
                {this.renderMemos()}
                {this.renderFlags()}
                {this.renderFee()}
                {this.renderServiceFee()}
                {this.renderWarnings()}
                {this.renderHookExplainer()}
            </>
        );
    }
}

export default GlobalTemplate;
