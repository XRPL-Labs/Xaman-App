import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import LedgerService from '@services/LedgerService';

import { TrustLineModel } from '@store/models';

import { TrustSet } from '@common/libs/ledger/transactions';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AmountText } from '@components/General';
import { AccountElement } from '@components/Modules';

import Localize from '@locale';

import { AppStyles } from '@theme';
import styles from '../styles';

import { TemplateProps } from '../types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: TrustSet;
}

export interface State {
    isLoadingIssuerFee: boolean;
    issuerFee: number;
    isSetDefaultState: boolean;
}

/* Component ==================================================================== */
class TrustSetTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoadingIssuerFee: true,
            issuerFee: 0,
            isSetDefaultState: false,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            this.setTokenDefaultState();
            this.setIssuerTransferFee();
        });
    }

    setTokenDefaultState = () => {
        const { transaction, source } = this.props;

        // check if trustLine is setting to the default state
        const line = source.lines?.find(
            (token: TrustLineModel) =>
                token.currency.issuer === transaction.Issuer && token.currency.currencyCode === transaction.Currency,
        );

        if (!line) {
            return;
        }

        if (
            ((source.flags?.defaultRipple && transaction.Flags?.tfClearNoRipple) ||
                (!source.flags?.defaultRipple && transaction.Flags?.tfSetNoRipple)) &&
            (!line.freeze || (line.freeze && transaction.Flags?.tfClearFreeze)) &&
            transaction.Limit === 0
        ) {
            this.setState({
                isSetDefaultState: true,
            });
        }
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
        const { isLoadingIssuerFee, issuerFee, isSetDefaultState } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.issuer')}
                    </Text>
                </View>
                <AccountElement
                    address={transaction.Issuer}
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                />

                <Text style={styles.label}>{Localize.t('global.asset')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{NormalizeCurrencyCode(transaction.Currency)}</Text>
                </View>

                <Text style={styles.label}>{Localize.t('global.issuerFee')}</Text>
                <View style={styles.contentBox}>
                    <Text style={styles.value}>{isLoadingIssuerFee ? 'Loading...' : `${issuerFee}%`}</Text>
                </View>

                <Text style={styles.label}>{Localize.t('global.balanceLimit')}</Text>
                <View style={styles.contentBox}>
                    {isSetDefaultState ? (
                        <Text style={[styles.value, AppStyles.colorRed]}>{Localize.t('asset.removeAsset')}</Text>
                    ) : (
                        <AmountText style={styles.value} value={transaction.Limit} immutable />
                    )}
                </View>
            </>
        );
    }
}

export default TrustSetTemplate;
