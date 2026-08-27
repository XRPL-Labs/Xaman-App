import { get, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { Batch } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
// eslint-disable-next-line import/no-cycle
import * as GenuineTransactionTemplates from '.';

// import { HexEncoding } from '@common/utils/string';
import { BatchSigner } from '@common/libs/ledger/types/common';
// import { Transaction } from '@components/Modules/EventsList/EventListItems';
import { TransactionFactory } from '@common/libs/ledger/factory';
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { MixingTypes } from '@common/libs/ledger/mixin/types';
import { utils } from 'xrpl-accountlib';
import NetworkService from '@services/NetworkService';
import { AccountModel } from '@store/models';
import { AccountRepository } from '@store/repositories';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Batch;
}

export interface State {}

/* Component ==================================================================== */
class BatchTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    // renderAcceptedCredentials = () => {
    //     const { transaction } = this.props;

    //     if (isEmpty(transaction.AcceptedCredentials)) {
    //         return (
    //             <View style={styles.contentBox}>
    //                 <Text style={styles.value}>{Localize.t('global.empty')}</Text>
    //             </View>
    //         );
    //     }

    //     return transaction.AcceptedCredentials.map((credential) => {
    //         return (
    //             <View style={[
    //                 styles.credentialContainer,
    //             ]} key={credential.Issuer}>
    //                 <AccountElement address={credential.Issuer} containerStyle={styles.attachedAccountElement} />
    //                 <View style={styles.authorizeCredentialsContainer}>
    //                     <Text style={[AppStyles.monoSubText, AppStyles.colorGrey]}>
    //                         {Localize.t('global.credentialType')}:{' '}
    //                         <Text style={AppStyles.colorBlue}>{
    //                             HexEncoding.displayHex(String(credential.CredentialType))
    //                         }</Text>
    //                     </Text>
    //                 </View>
    //             </View>
    //         );
    //     });
    // };

    renderSigners = () => {
        const { transaction } = this.props;

        if (isEmpty(transaction.BatchSigners)) {
            return undefined;
        }

        return transaction.BatchSigners.map((s) => {
            const signer = { BatchSigner: s } as unknown as BatchSigner;
            return (
                <View key={signer.BatchSigner.Account}>
                    <AccountElement address={signer.BatchSigner.Account} />
                </View>
            );
        });
    };

    renderInnerTransactions = () => {
        const { transaction, source, payload } = this.props;

        if (isEmpty(transaction.RawTransactions)) {
            return undefined;
        }

        return transaction.RawTransactions.map((t, index) => {
            const tx = TransactionFactory.fromJson({ ...t } as unknown as TransactionJson, [MixingTypes.Mutation]);
            const hash = utils.hashBatchInnerTxn(
                { ...t } as unknown as TransactionJson,
                NetworkService.getNetworkDefinitions(),
            );

            const matchingSourceAccount = AccountRepository.findOne({ address: tx.Account });

            const Props = {
                source: matchingSourceAccount ||
                    { address: tx.Account } as AccountModel, // TODO: find local accounts first
                transaction: tx,
                payload,
                innerBatch: true,
                forceRender: () => {
                    // console.log('forceRender');
                },
                setLoading: () => {
                    // console.log('setLoading');
                },
                setReady: () => {
                    // console.log('setReady');
                },
                setServiceFee: () => {},
            } as any;

            return <View style={[
                styles.transactionContainer,
                !matchingSourceAccount && styles.transactionContainerThirdParty,
                matchingSourceAccount && source.address !== matchingSourceAccount.address &&
                    styles.transactionContainerMineOther,
            ]}>
                <View style={[
                    styles.innerTransactionHeader,
                    !matchingSourceAccount && styles.innerTransactionHeaderThirdParty,
                    matchingSourceAccount && source.address !== matchingSourceAccount.address &&
                        styles.innerTransactionHeaderMineOther,
                ]}>
                    {matchingSourceAccount && source.address === matchingSourceAccount.address && (
                        <View>
                            <Text style={styles.headerDesc}>{Localize.t('txBatch.txMineAndSelected')}</Text>
                        </View>
                    )}

                    {matchingSourceAccount && source.address !== matchingSourceAccount.address && (
                        <View>
                            <Text style={styles.headerDesc}>{Localize.t('txBatch.txMineButOther')}</Text>
                        </View>
                    )}

                    {!matchingSourceAccount && (
                        <View>
                            <Text style={[
                                styles.headerDesc,
                                styles.headerDescThirdParty,
                            ]}>{Localize.t('txBatch.txThirdParty')}</Text>
                        </View>
                    )}

                    <View style={styles.headerCountContainer}>
                        <Text style={styles.headerTxType}>{tx.TransactionType}</Text>
                        <Text style={styles.headerCount}>({index + 1}/{transaction.RawTransactions.length})</Text>
                    </View>
                </View>

                <View style={[
                    styles.innerTransactionContainerBorder,
                ]}>
                    <View>
                        <View style={styles.label}>
                            <Text style={[
                                styles.fromAccount,
                            ]}>
                                {Localize.t('global.from')}
                            </Text>
                        </View>

                        <AccountElement
                            address={Props.source.address}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />

                        {
                            React.createElement(get(GenuineTransactionTemplates, String(tx.TransactionType)), {
                                ...Props,
                                key: `InnerTxn-${hash}`,
                            })
                        }
                        {
                            React.createElement(get(GenuineTransactionTemplates, 'Global'), {
                                ...Props,
                                key: `InnerTxn-${hash}-GlobalTemplate`,
                            })
                        }
                    </View>
                </View>
            </View>;

            // return (
            //     <View key={hash}>
            //         <Transaction
            //             showDespiteThirdParty
            //             onPress={() => {
            //                 // TODO: modal to render and approve
            //             }}
            //             item={tx}
            //             account={
            //                 { address: t.Account } as AccountModel
            //             }
            //             timestamp={0}
            //         />
            //     </View>
            // );
        });
    };

    render() {
        const { transaction } = this.props;

        return (
            <View>
                {transaction.BatchSigners && transaction.BatchSigners.length > 0 && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('txBatch.title')} {Localize.t('global.signerEntries')}
                            </Text>
                        </View>
                        {this.renderSigners()}
                    </>
                )}
                
                <View style={[
                    styles.label,
                    transaction.BatchSigners && transaction.BatchSigners.length > 0 && AppStyles.marginTopSml,
                ]}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.transactions')}
                    </Text>
                </View>
                <View style={[
                    AppStyles.marginBottomSml,
                ]}>
                    {this.renderInnerTransactions()}
                </View>
            </View>
        );
    }
}

export default BatchTemplate;
