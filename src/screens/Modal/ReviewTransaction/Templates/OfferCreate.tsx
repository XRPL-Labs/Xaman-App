import React, { Component } from 'react';
import { View, Text } from 'react-native';
import isEmpty from 'lodash/isEmpty';

import { OfferCreate } from '@common/libs/ledger/transactions';
import { getAccountName } from '@common/helpers/resolver';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: OfferCreate;
}

export interface State {
    takerGetsIssuerName: string;
    takerPaysIssuerName: string;
}

/* Component ==================================================================== */
class OfferCreateTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            takerGetsIssuerName: '',
            takerPaysIssuerName: '',
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        if (transaction.TakerGets.issuer) {
            getAccountName(transaction.TakerGets.issuer)
                .then((res: any) => {
                    if (!isEmpty(res)) {
                        this.setState({
                            takerGetsIssuerName: res.name,
                        });
                    }
                })
                .catch(() => {});
        }

        if (transaction.TakerPays.issuer) {
            getAccountName(transaction.TakerPays.issuer)
                .then((res: any) => {
                    if (!isEmpty(res)) {
                        this.setState({
                            takerPaysIssuerName: res.name,
                        });
                    }
                })
                .catch(() => {});
        }
    }

    render() {
        const { transaction } = this.props;
        const { takerGetsIssuerName, takerPaysIssuerName } = this.state;

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.takerGets')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.amount]}>
                        {`${transaction.TakerGets.value} ${transaction.TakerGets.currency}`}
                    </Text>
                </View>

                {transaction.TakerGets.issuer && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.issuer')}</Text>
                        <View style={[styles.contentBox]}>
                            {takerGetsIssuerName ? (
                                <Text style={styles.value}>{takerGetsIssuerName}</Text>
                            ) : (
                                <Text style={styles.address}>{transaction.TakerGets.issuer}</Text>
                            )}
                        </View>
                    </>
                )}

                <Text style={[styles.label]}>{Localize.t('global.takerPays')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.amount]}>
                        {`${transaction.TakerPays.value} ${transaction.TakerPays.currency}`}
                    </Text>
                </View>

                {transaction.TakerPays.issuer && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.issuer')}</Text>
                        <View style={[styles.contentBox]}>
                            {takerPaysIssuerName ? (
                                <Text style={styles.value}>{takerPaysIssuerName}</Text>
                            ) : (
                                <Text style={styles.address}>{transaction.TakerPays.issuer}</Text>
                            )}
                        </View>
                    </>
                )}

                {transaction.Expiration && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.expireAfter')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{transaction.Expiration}</Text>
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
