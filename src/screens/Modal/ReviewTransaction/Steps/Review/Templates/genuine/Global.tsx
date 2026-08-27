import { find, isEmpty, isUndefined } from 'lodash';
import React, { Component } from 'react';
import { InteractionManager, Text, View } from 'react-native';

import { MutatedTransaction, SignableTransaction, Transactions } from '@common/libs/ledger/transactions/types';

import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { AmountParser } from '@common/libs/ledger/parser/common';

import NetworkService from '@services/NetworkService';

import { AccountRepository } from '@store/repositories';

import { InfoMessage, ServiceFeeSpendable } from '@components/General'; // ReadMore
import { FeePicker, ServiceFee, AccountElement, HooksExplainer } from '@components/Modules';

import { CalculateAvailableBalance } from '@common/utils/balance';

import Localize from '@locale';

import styles from '../styles';

import { Clipboard } from '@common/helpers/clipboard';

import { TemplateProps } from '../types';
import { HookExplainerOrigin } from '@components/Modules/HooksExplainer/HooksExplainer';
import { Toast } from '@common/helpers/interface';
import { AppStyles } from '@theme/index';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: SignableTransaction & MutatedTransaction;
    serviceFee?: number;
    setServiceFee: (serviceFee: number) => void;
    canSendFee: (canSend: boolean) => void;
    setTransaction: (tx: SignableTransaction & MutatedTransaction, forced?: boolean) => void;
}
export interface State {
    warnings?: Array<string>;
    showFeePicker: boolean;
    canSendFee: boolean;
}

/* Component ==================================================================== */
class GlobalTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        // console.log('ReviewTx Global')

        this.state = {
            warnings: undefined,
            canSendFee: true,
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
        const { setServiceFee, transaction, source } = this.props;

        if (transaction && source) {
            let isXrpPayment = false;
            try {
                isXrpPayment = transaction &&
                    transaction.TransactionType === 'Payment' &&
                    (transaction as any)?.Amount?.currency === NetworkService.getNativeAsset();
            } catch (e) {
                // console.log(e)
            }

            if (!isXrpPayment) {
                const sfee = Number(fee?.value || 0) / 1_000_000;
                const avail = CalculateAvailableBalance(source!);
                const spendable = (Math.floor(Number(avail) * 1_000_000) - 100) / 1_000_000; 
                if (spendable < sfee) {
                    setServiceFee(Math.floor(Number(avail) * 1_000_000) - 100);
                    // console.log(`${sfee} higher: ${spendable}, set ${Math.floor(Number(avail) * 1_000_000) - 100}`);
                    return;
                }
            }
        }

        setServiceFee(Number(fee?.value || 0));
    };

    setFees = (txFee: any, serviceFee: any) => {
        this.setTransactionFee(txFee);
        this.setServiceFeeAmount(serviceFee);
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
                    {
                        transaction.Memos.map((m, i) => {
                            return (
                                <View
                                    style={styles.memoContainer}
                                    key={`memo-${i}`}
                                >
                                    {m.MemoType && (
                                        <Text style={[styles.value, styles.memoType]}>{m.MemoType}</Text>
                                    )}
                                    {m.MemoFormat && (
                                        <Text style={[styles.value, styles.memoFormat]}>{m.MemoFormat}</Text>
                                    )}
                                    {m.MemoData && (
                                        <Text
                                            style={[styles.value, styles.memoData]}
                                            onPress={() => {
                                                if (String(m.MemoData) !== '') {
                                                    Clipboard.setString(String(m.MemoData));
                                                    Toast(Localize.t('payload.dataCopiedToClipboard'));
                                                }
                                            }}
                                        >{m.MemoData}</Text>
                                    )}
                                </View>
                            );
                        })
                    }
                    {/* <ReadMore numberOfLines={3} textStyle={styles.value}>
                        {transaction.Memos.map((m) => {
                            let memo = '';
                            memo += m.MemoType ? `${m.MemoType}\n` : '';
                            memo += m.MemoFormat ? `${m.MemoFormat}\n` : '';
                            memo += m.MemoData ? `${m.MemoData}\n` : '';
                            return memo;
                        })}
                    </ReadMore> */}
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
                    {/* <Text style={styles.label}>{Localize.t('global.hooks')}</Text> */}
                    <View style={styles.contentBox}>
                        <HooksExplainer
                            transaction={transaction as Transactions}
                            account={source}
                            origin={HookExplainerOrigin.ReviewPayload}
                        />
                    </View>
                </>
            );
        }

        return null;
    };

    // Can it actually send tx + fee?
    canSendFee = (canSend: boolean) => {
        const { canSendFee } = this.state;
        const {
            canSendFee: parentCanSendFee,
        } = this.props;

        if (canSend !== canSendFee) {
            if (typeof parentCanSendFee === 'function') {
                parentCanSendFee(canSend);
            }
            this.setState({
                canSendFee: canSend,
            });
        }
    };

    renderFee = () => {
        const {
            transaction,
            source,
            payload,
            serviceFee,
            setTransaction,
        } = this.props;

        const {
            showFeePicker,
            canSendFee,
        } = this.state;

        // we should not override the fee
        // either transaction fee has already been set in payload
        // or transaction is a multi sign tx
        if (!showFeePicker) { //  && !(process?.env?.NODE_ENV === 'development') // TODO: REMOVE(d)
            if (typeof transaction.Fee !== 'undefined') {
                return (
                    <>
                        <>
                            <Text style={styles.label}>{Localize.t('global.fee')}</Text>
                            <View style={styles.contentBox}>
                                <Text style={styles.feeText}>
                                    {transaction.Fee.value} {NetworkService.getNativeAsset()}
                                </Text>
                            </View>
                        </>
                        <>
                            <Text style={styles.label}>{Localize.t('events.serviceFee')}</Text>
                            <View style={styles.contentBox}>
                                <ServiceFee
                                    txJson={transaction.JsonForSigning}
                                    textStyle={styles.feeText}
                                    payload={payload}
                                    onSelect={this.setServiceFeeAmount}
                                />
                            </View>
                        </>
                    </>
                );
            }

            return null;
        }
        
        const sendDrops = Math.ceil(Number(
            typeof transaction?.JsonForSigning?.Amount === 'string'
                ? (transaction as any)?.Amount?.value
                    ? Number(String((transaction as any)?.Amount?.value || '0')) * 1_000_000
                    : transaction?.JsonForSigning?.Amount
                : 0,
        ));

        const amountField = 'Amount';
        // if (transaction.TransactionType === 'OfferCreate') {
        //     amountField = 'TakerGets';
        // }
        let isXrpPayment = false;
        try {
            isXrpPayment = transaction &&
                transaction.TransactionType === 'Payment' &&
                (transaction as any)?.Amount?.currency === NetworkService.getNativeAsset();
        } catch (e) {
            // console.log(e)
        }

        return (
            <>
                <Text style={styles.label}>{Localize.t('events.txServiceFees')}</Text>
                <FeePicker
                    // ref={`feepicker-${sendDrops}`}
                    sendAmountDrops={sendDrops}
                    txJson={transaction.JsonForSigning}
                    onSelect={this.setFees}
                    source={source}
                    payload={payload}
                    containerStyle={styles.contentBox}
                    textStyle={styles.feeText}
                />
                {/* <Text style={AppStyles.colorWhite}>{ String((transaction as any)?.Amount?.value || '') }</Text> */}
                <View style={[
                    !canSendFee && AppStyles.marginTopSml,
                ]}>
                    <ServiceFeeSpendable
                        txType={transaction?.TransactionType || transaction?.JsonForSigning?.TransactionType}
                        spendableBalanceDrops={Math.floor(Number(CalculateAvailableBalance(source!)) * 1_000_000)}
                        serviceFeeDrops={Number(serviceFee || 0)}
                        txFeeDrops={Number(transaction?.JsonForSigning?.Fee || 0)}
                        sendAmountDrops={Math.ceil(Number(
                            typeof (transaction?.JsonForSigning?.[amountField]) === 'string'
                                ? (transaction as any)?.[amountField]?.value
                                    ? Number(String((transaction as any)?.[amountField]?.value || '0')) * 1_000_000
                                    : transaction?.JsonForSigning?.[amountField]
                                : 0,
                        ))}
                        onTxMaySend={this.canSendFee}
                        updateSendingAmountDrops={
                            isXrpPayment
                                ? (drops) => { 
                                    if (isXrpPayment) {
                                        (transaction as any).Amount = {
                                            ...(transaction as any).Amount,
                                            value: String(drops / 1_000_000),
                                        };
                                        setTransaction(transaction, true);
                                    }
                                }
                                : undefined
                        }
                    />
                </View>
            </>
        );
    };

    render() {
        const { innerBatch } = this.props;

        return (
            <>
                {this.renderHookParameters()}
                {this.renderNetworkId()}
                {this.renderOperationLimit()}
                {this.renderTicketSequence()}
                {this.renderSequence()}
                {!innerBatch && this.renderSigners()}
                {this.renderMemos()}
                {this.renderFlags()}
                {!innerBatch && this.renderFee()}
                {this.renderWarnings()}
                {!innerBatch && this.renderHookExplainer()}
            </>
        );
    }
}

export default GlobalTemplate;
