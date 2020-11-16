import isEmpty from 'lodash/isEmpty';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { LedgerService } from '@services';

import { EscrowFinish } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { RecipientElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: EscrowFinish;
}

export interface State {
    isLoading: boolean;
    ownerDetails: AccountNameType;
}

/* Component ==================================================================== */
class EscrowFinishTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            ownerDetails: {
                name: '',
                source: '',
            },
        };
    }
    async componentDidMount() {
        const { transaction } = this.props;

        // in case of OfferSequence is not exist and PreviousTxnID is set fetch the sequence
        // from transaction id
        if (!transaction.OfferSequence && transaction.PreviousTxnID) {
            await LedgerService.getTransaction(transaction.PreviousTxnID).then((tx: any) => {
                const { Sequence } = tx;
                if (Sequence) {
                    transaction.OfferSequence = Sequence;
                }
            });
        }

        getAccountName(transaction.Owner)
            .then((res: any) => {
                if (!isEmpty(res) && !res.error) {
                    this.setState({
                        ownerDetails: res,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoading, ownerDetails } = this.state;
        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.owner')}
                    </Text>
                </View>
                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    showAvatar={false}
                    recipient={{
                        address: transaction.Owner,
                        ...ownerDetails,
                    }}
                />
                <Text style={[styles.label]}>{Localize.t('global.offerSequence')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={styles.value}>{transaction.OfferSequence}</Text>
                </View>
            </>
        );
    }
}

export default EscrowFinishTemplate;
