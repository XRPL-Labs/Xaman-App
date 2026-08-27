import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import { Clawback } from '@common/libs/ledger/transactions';

import { AmountText } from '@components/General';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
import { AccountElement, MPTWidget } from '@components/Modules';
import { AppStyles } from '@theme/index';
import { ComponentTypes } from '@services/NavigationService';
import LedgerService from '@services/LedgerService';
import { MPTokenIssuance } from '@common/libs/ledger/objects';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: Clawback;
}

export interface State {
    mptIssuanceDetails?: MPTokenIssuance;
}

/* Component ==================================================================== */
class ClawbackTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            mptIssuanceDetails: undefined,
        };
    }

    isMPTAmount = () => {
        const { transaction } = this.props;
        return transaction?.Amount &&
            typeof transaction?.Amount !== 'string' &&
            transaction.Amount?.mpt_issuance_id && 
            String(transaction.Amount.mpt_issuance_id).length === 48;
    };

    fetchMPTDetails = async () => {
        const { transaction } = this.props;

        if (this.isMPTAmount()) {
            const [issuance] = await Promise.all([
                LedgerService.getLedgerEntry({
                    command: 'ledger_entry',
                    mpt_issuance: transaction?.Amount?.mpt_issuance_id,
                }),
            ]);

            if ((issuance as any)?.node) {
                this.setState({
                    mptIssuanceDetails: (issuance as any).node as MPTokenIssuance,
                });
            }
        }
    };

    componentDidMount() {
        InteractionManager.runAfterInteractions(() => {
            // fetch mpt details
            this.fetchMPTDetails();
        });
    }

    render() {
        const { transaction, source } = this.props;
        const {
            mptIssuanceDetails,
        } = this.state;

        return (
            <>
                {transaction.Holder && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.holder')}
                            </Text>
                        </View>
                        <AccountElement
                            address={transaction.Holder}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                <View style={styles.contentBox}>
                    <AmountText
                        value={transaction.Amount!.value}
                        currency={transaction.Amount!.currency}
                        style={styles.amount}
                        immutable
                    />
                </View>

                {mptIssuanceDetails && (
                    <>
                        <Text style={[
                            styles.label,
                            AppStyles.marginTopSml,
                        ]}>{Localize.t('mptokenIssuance.explainerTitle')}</Text>
                        <MPTWidget
                            isPaymentScreen
                            labelStyle={[styles.label, styles.labelSmall]}
                            contentStyle={[
                                styles.contentBox,
                                styles.value,
                                styles.valueSmall,
                            ]}
                            item={mptIssuanceDetails!}
                            account={source}
                            componentType={ComponentTypes.Unknown}
                        />
                    </>
                )}
            </>
        );
    }
}

export default ClawbackTemplate;
