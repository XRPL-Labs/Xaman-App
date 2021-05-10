/* eslint-disable react/jsx-one-expression-per-line */
import BigNumber from 'bignumber.js';
import { has, isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import LedgerService from '@services/LedgerService';

import { TrustSet } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';
import { NormalizeCurrencyCode } from '@common/utils/amount';

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
    isLoadingIssuerDetails: boolean;
    isLoadingIssuerFee: boolean;
    issuerDetails: AccountNameType;
    issuerFee: number;
}

/* Component ==================================================================== */
class TrustSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoadingIssuerDetails: true,
            isLoadingIssuerFee: true,
            issuerDetails: {
                name: '',
                source: '',
            },
            issuerFee: 0,
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        // get transfer rate from issuer account
        LedgerService.getAccountInfo(transaction.Issuer)
            .then((issuerAccountInfo: any) => {
                if (has(issuerAccountInfo, ['account_data', 'TransferRate'])) {
                    const { TransferRate } = issuerAccountInfo.account_data;

                    const fee = new BigNumber(TransferRate).dividedBy(10000000).minus(100).toNumber();

                    this.setState({
                        issuerFee: fee,
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
                    isLoadingIssuerDetails: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoadingIssuerDetails, issuerDetails, isLoadingIssuerFee, issuerFee } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.issuer')}
                    </Text>
                </View>
                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoadingIssuerDetails}
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

                <Text style={[styles.label]}>{Localize.t('global.issuerFee')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{isLoadingIssuerFee ? 'Loading...' : `${issuerFee}%`}</Text>
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
