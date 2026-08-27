import { isUndefined } from 'lodash';
import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { MPTokenAuthorize } from '@common/libs/ledger/transactions';

import { AccountElement, MPTWidget } from '@components/Modules';

import Localize from '@locale';

import styles from '../styles';

import { TemplateProps } from '../types';
import { DecodeMPTokenIssuanceToIssuer } from '@common/utils/codec';
import { ComponentTypes } from '@services/NavigationService';
import LedgerService from '@services/LedgerService';
import { MPTokenIssuance } from '@common/libs/ledger/objects';
import { AppStyles } from '@theme/index';

/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: MPTokenAuthorize;
}

export interface State {
    mptIssuanceDetails?: MPTokenIssuance | boolean;
}

/* Component ==================================================================== */
class MPTokenAuthorizeTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {};
    }

    componentDidMount() {
        const { transaction } = this.props;

        if (transaction.MPTokenIssuanceID) {
            LedgerService.getLedgerEntry({
                command: 'ledger_entry',
                mpt_issuance: transaction.MPTokenIssuanceID,
            }).then((resp) => {
                if ('error' in resp) {
                    this.setState({
                        mptIssuanceDetails: false,
                    });
                    return;
                }

                const { node } = resp;

                if (node) {
                    this.setState({
                        mptIssuanceDetails: node as MPTokenIssuance,
                    });
                }
            });
        }
    }

    render() {
        const { transaction, source } = this.props;
        const { mptIssuanceDetails } = this.state;

        return (
            <>
                {!isUndefined(transaction.Holder) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.holder')}</Text>
                        <AccountElement
                            address={transaction.Holder}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {!isUndefined(transaction.MPTokenIssuanceID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.issuer')}</Text>
                        <AccountElement
                            address={DecodeMPTokenIssuanceToIssuer(transaction.MPTokenIssuanceID)}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {!isUndefined(transaction.MPTokenIssuanceID) && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.mpTokenIssuanceID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>
                                {transaction.MPTokenIssuanceID || Localize.t('global.empty')}
                            </Text>
                        </View>
                    </>
                )}

                {!mptIssuanceDetails && typeof mptIssuanceDetails !== 'boolean' && (
                    <View style={[styles.contentBox, AppStyles.centerAligned, styles.contentBoxSecondary]}>
                        <Text style={[styles.value, styles.label]}>{Localize.t('mptoken.loading')}</Text>
                    </View>
                )}

                {!mptIssuanceDetails && typeof mptIssuanceDetails === 'boolean' && (
                    <View style={[
                        styles.contentBox,
                        AppStyles.centerAligned,
                        styles.contentBoxSecondary,
                        AppStyles.buttonRed,
                    ]}>
                        <Text style={[
                            styles.value,
                            styles.label,
                            AppStyles.colorWhite,
                        ]}>{Localize.t('mptoken.issuanceNotFound')}</Text>
                    </View>
                )}

                {mptIssuanceDetails && typeof mptIssuanceDetails !== 'boolean' && (
                    <MPTWidget
                        isPaymentScreen
                        noIssuanceId
                        labelStyle={[styles.label, styles.labelSmall]}
                        contentStyle={[
                            styles.contentBox,
                            styles.value,
                            styles.valueSmall,
                        ]}
                        item={mptIssuanceDetails}
                        account={source}
                        componentType={ComponentTypes.Unknown}
                    />
                )}
            </>
        );
    }
}

export default MPTokenAuthorizeTemplate;
