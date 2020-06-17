import React, { Component } from 'react';
import { View, Text, Platform, ActivityIndicator } from 'react-native';
import isEmpty from 'lodash/isEmpty';

import { OfferCreate } from '@common/libs/ledger/transactions';
import { getAccountName } from '@common/helpers/resolver';

import { FormatDate, NormalizeCurrencyCode } from '@common/libs/utils';

import Localize from '@locale';

import { AppColors } from '@theme';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: OfferCreate;
}

export interface State {
    takerGetsIssuerName: string;
    takerPaysIssuerName: string;
    isLoading: boolean;
}

/* Component ==================================================================== */
class OfferCreateTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            takerGetsIssuerName: '',
            takerPaysIssuerName: '',
            isLoading: false,
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        if (transaction.TakerGets.issuer) {
            getAccountName(transaction.TakerGets.issuer)
                .then((res: any) => {
                    if (!isEmpty(res)) {
                        this.setState({
                            takerGetsIssuerName: res.name,
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

        if (transaction.TakerPays.issuer) {
            getAccountName(transaction.TakerPays.issuer)
                .then((res: any) => {
                    if (!isEmpty(res)) {
                        this.setState({
                            takerPaysIssuerName: res.name,
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
    }

    render() {
        const { transaction } = this.props;
        const { takerGetsIssuerName, takerPaysIssuerName, isLoading } = this.state;

        return (
            <>
                <Text style={[styles.label]}>{Localize.t('global.takerGets')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.amount]}>
                        {`${transaction.TakerGets.value} ${NormalizeCurrencyCode(transaction.TakerGets.currency)}`}
                    </Text>
                </View>

                {transaction.TakerGets.issuer && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.issuer')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>
                                {isLoading ? (
                                    Platform.OS === 'ios' ? (
                                        <ActivityIndicator color={AppColors.blue} />
                                    ) : (
                                        'Loading...'
                                    )
                                ) : (
                                    takerGetsIssuerName || transaction.TakerGets.issuer
                                )}
                            </Text>
                        </View>
                    </>
                )}

                <Text style={[styles.label]}>{Localize.t('global.takerPays')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.amount]}>
                        {`${transaction.TakerPays.value} ${NormalizeCurrencyCode(transaction.TakerPays.currency)}`}
                    </Text>
                </View>
                {transaction.TakerPays.issuer && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.issuer')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>
                                {isLoading ? (
                                    Platform.OS === 'ios' ? (
                                        <ActivityIndicator color={AppColors.blue} />
                                    ) : (
                                        'Loading...'
                                    )
                                ) : (
                                    takerPaysIssuerName || transaction.TakerPays.issuer
                                )}
                            </Text>
                        </View>
                    </>
                )}

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
