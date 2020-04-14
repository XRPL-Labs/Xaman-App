/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import isEmpty from 'lodash/isEmpty';

import { TrustSet } from '@common/libs/ledger/transactions';

import { getAccountName } from '@common/helpers/resolver';
import { NormalizeCurrencyCode } from '@common/libs/utils';

import Localize from '@locale';

import { AppColors } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: TrustSet;
}

export interface State {
    isLoading: boolean;
    issuerName: string;
}

/* Component ==================================================================== */
class TrustSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: false,
            issuerName: '',
        };
    }
    componentDidMount() {
        const { transaction } = this.props;

        this.setState({
            isLoading: true,
        });

        getAccountName(transaction.Issuer)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        issuerName: res.name,
                    });
                }
            })
            .finally(() => {
                this.setState({
                    isLoading: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoading, issuerName } = this.state;
        return (
            <>
                <Text style={[styles.label]}>
                    {Localize.t('global.issuer')}:{' '}
                    {isLoading ? (
                        Platform.OS === 'ios' ? (
                            <ActivityIndicator color={AppColors.blue} />
                        ) : (
                            'Loading...'
                        )
                    ) : (
                        <Text style={styles.value}>{issuerName} </Text>
                    )}
                </Text>
                <View style={[styles.contentBox]}>
                    <Text selectable style={[styles.address]}>
                        {transaction.Issuer}
                    </Text>
                </View>
                <Text style={[styles.label]}>{Localize.t('global.currency')}:</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{NormalizeCurrencyCode(transaction.Currency)}</Text>
                </View>
            </>
        );
    }
}

export default TrustSetTemplate;
