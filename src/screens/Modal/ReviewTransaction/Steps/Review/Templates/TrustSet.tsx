/* eslint-disable react/jsx-one-expression-per-line */
import React, { Component } from 'react';
import { View, Text } from 'react-native';
import isEmpty from 'lodash/isEmpty';

import { TrustSet } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';
import { NormalizeCurrencyCode } from '@common/libs/utils';

import Localize from '@locale';

import { AmountText } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: TrustSet;
}

export interface State {
    isLoading: boolean;
    issuerDetails: AccountNameType;
}

/* Component ==================================================================== */
class TrustSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoading: true,
            issuerDetails: {
                name: '',
                source: '',
            },
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        getAccountName(transaction.Issuer)
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
                    isLoading: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoading, issuerDetails } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGreyDark]}>
                        {Localize.t('global.issuer')}
                    </Text>
                </View>
                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoading}
                    showAvatar={false}
                    recipient={{
                        address: transaction.Issuer,
                        ...issuerDetails,
                    }}
                />
                <Text style={[styles.label]}>{Localize.t('global.asset')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{NormalizeCurrencyCode(transaction.Currency)}</Text>
                </View>
                <Text style={[styles.label]}>{Localize.t('global.balanceLimit')}</Text>
                <View style={[styles.contentBox]}>
                    {transaction.Limit ? (
                        <AmountText style={[styles.value]} value={transaction.Limit} />
                    ) : (
                        <Text style={[styles.value, AppStyles.colorRed]}>{Localize.t('asset.removeAsset')}</Text>
                    )}
                </View>
            </>
        );
    }
}

export default TrustSetTemplate;
