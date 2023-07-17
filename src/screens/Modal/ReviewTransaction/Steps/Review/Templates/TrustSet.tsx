/* eslint-disable react/jsx-one-expression-per-line */

import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import LedgerService from '@services/LedgerService';

import { TrustLineModel } from '@store/models';

import { TrustSet } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';
import { NormalizeCurrencyCode } from '@common/utils/amount';

import Localize from '@locale';

import { AmountText } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: TrustSet;
}

export interface State {
    isLoadingIssuerDetails: boolean;
    isLoadingIssuerFee: boolean;
    issuerDetails: AccountNameType;
    issuerFee: number;
    isSetDefaultState: boolean;
}

/* Component ==================================================================== */
class TrustSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoadingIssuerDetails: true,
            isLoadingIssuerFee: true,
            issuerDetails: undefined,
            issuerFee: 0,
            isSetDefaultState: false,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.setTokenDefaultState();
            this.setIssuerTransferFee();
            this.setIssuerDetails();
        });
    }

    setTokenDefaultState = () => {
        const { transaction, source } = this.props;

        // check if trustLine is setting to the default state
        const line = source.lines.find(
            (token: TrustLineModel) =>
                token.currency.issuer === transaction.Issuer && token.currency.currency === transaction.Currency,
        );

        if (!line) {
            return;
        }

        if (
            ((source.flags?.defaultRipple && transaction.Flags?.ClearNoRipple) ||
                (!source.flags?.defaultRipple && transaction.Flags?.SetNoRipple)) &&
            (!line.freeze || (line.freeze && transaction.Flags?.ClearFreeze)) &&
            transaction.Limit === 0
        ) {
            this.setState({
                isSetDefaultState: true,
            });
        }
    };

    setIssuerDetails = () => {
        const { transaction } = this.props;
        // set issuer details
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
    };

    setIssuerTransferFee = () => {
        const { transaction } = this.props;
        // get transfer rate from issuer account
        LedgerService.getAccountTransferRate(transaction.Issuer)
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
    };

    render() {
        const { transaction } = this.props;
        const { isLoadingIssuerDetails, issuerDetails, isLoadingIssuerFee, issuerFee, isSetDefaultState } = this.state;

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
                    {isSetDefaultState ? (
                        <Text style={[styles.value, AppStyles.colorRed]}>{Localize.t('asset.removeAsset')}</Text>
                    ) : (
                        <AmountText style={[styles.value]} value={transaction.Limit} immutable />
                    )}
                </View>
            </>
        );
    }
}

export default TrustSetTemplate;
