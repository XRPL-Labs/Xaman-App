import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import LedgerService from '@services/LedgerService';

import { OfferCreate } from '@common/libs/ledger/transactions';
import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import { AmountText } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { FormatDate } from '@common/utils/date';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: OfferCreate;
}

export interface State {
    isLoadingIssuerDetails: boolean;
    isLoadingIssuerFee: boolean;
    issuerDetails: AccountNameType;
    issuerFee: number;
}

/* Component ==================================================================== */
class OfferCreateTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoadingIssuerDetails: true,
            isLoadingIssuerFee: true,
            issuerDetails: undefined,
            issuerFee: 0,
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        const issuerAddress = transaction.TakerGets.issuer || transaction.TakerPays.issuer;

        // get transfer rate from issuer account
        LedgerService.getAccountTransferRate(issuerAddress)
            .then((issuerFee) => {
                if (issuerFee) {
                    this.setState({
                        issuerFee,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoadingIssuerFee: false,
                });
            });

        getAccountName(issuerAddress)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        issuerDetails: res,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoadingIssuerDetails: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoadingIssuerDetails, issuerDetails, isLoadingIssuerFee, issuerFee } = this.state;

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.issuer')}</Text>
                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoadingIssuerDetails}
                    recipient={{
                        address: transaction.TakerGets.issuer || transaction.TakerPays.issuer,
                        ...issuerDetails,
                    }}
                />

                <Text style={[styles.label]}>{Localize.t('global.selling')}</Text>
                <View style={[styles.contentBox]}>
                    <AmountText
                        value={transaction.TakerGets.value}
                        currency={transaction.TakerGets.currency}
                        style={styles.amount}
                        immutable
                    />
                </View>

                <Text style={[styles.label]}>
                    {transaction.Flags.Sell
                        ? Localize.t('global.inExchangeForAtLeastReceive')
                        : Localize.t('global.inExchangeForReceive')}
                </Text>
                <View style={[styles.contentBox]}>
                    <AmountText
                        value={transaction.TakerPays.value}
                        currency={transaction.TakerPays.currency}
                        style={styles.amount}
                        immutable
                    />
                </View>

                <Text style={[styles.label]}>{Localize.t('global.issuerFee')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{isLoadingIssuerFee ? 'Loading...' : `${issuerFee}%`}</Text>
                </View>

                {transaction.Expiration && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.expireAfter')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{FormatDate(transaction.Expiration)}</Text>
                        </View>
                    </>
                )}

                {transaction.OfferSequence && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.offerSequence')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={styles.value}>{transaction.OfferSequence}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default OfferCreateTemplate;
