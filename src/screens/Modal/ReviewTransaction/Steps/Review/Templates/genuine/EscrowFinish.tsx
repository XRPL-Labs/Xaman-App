import { isUndefined } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { LedgerService } from '@services';

import { EscrowFinish } from '@common/libs/ledger/transactions';

import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: EscrowFinish;
}

export interface State {
    offerSequence?: number;
}

/* Component ==================================================================== */
class EscrowFinishTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            offerSequence: undefined,
        };
    }
    async componentDidMount() {
        const { transaction } = this.props;

        // in case of OfferSequence is not exist and PreviousTxnID is set fetch the sequence
        // from transaction id
        if (isUndefined(transaction.OfferSequence) && transaction.PreviousTxnID) {
            await LedgerService.getTransaction(transaction.PreviousTxnID).then((tx: any) => {
                const { Sequence, TicketSequence } = tx;
                if (Sequence || TicketSequence) {
                    this.setState(
                        {
                            offerSequence: Sequence || TicketSequence,
                        },
                        () => {
                            transaction.OfferSequence = Sequence || TicketSequence;
                        },
                    );
                }
            });
        }
    }

    render() {
        const { transaction } = this.props;
        const { offerSequence } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.owner')}
                    </Text>
                </View>
                <AccountElement
                    address={transaction.Owner}
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                />

                {!isUndefined(offerSequence) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.offerSequence')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{offerSequence}</Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.EscrowID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.escrowID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{transaction.EscrowID}</Text>
                        </View>
                    </>
                )}

                {transaction?.CredentialIDs && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.credentialIDs')}</Text>
                        <View style={styles.contentBox}>
                            {transaction.CredentialIDs.map((id, index) => (
                                <Text key={`credential-${index}`} style={styles.value}>
                                    {id}
                                </Text>
                            ))}
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default EscrowFinishTemplate;
