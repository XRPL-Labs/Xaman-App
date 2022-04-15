/* eslint-disable react/jsx-one-expression-per-line */

import { isEmpty, isUndefined } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenMint } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import Localize from '@locale';

import { RecipientElement } from '@components/Modules';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: NFTokenMint;
}

export interface State {
    isLoadingIssuerDetails: boolean;
    issuerDetails: AccountNameType;
}

/* Component ==================================================================== */
class NFTokenMintTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoadingIssuerDetails: true,
            issuerDetails: undefined,
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        if (transaction.Issuer) {
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
    }

    render() {
        const { transaction } = this.props;
        const { isLoadingIssuerDetails, issuerDetails } = this.state;

        return (
            <>
                {transaction.Issuer && (
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
                    </>
                )}

                <Text style={[styles.label]}>{Localize.t('global.tokenTaxon')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{transaction.NFTokenTaxon}</Text>
                </View>

                {transaction.URI && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.uri')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text selectable style={[styles.value]}>
                                {transaction.URI}
                            </Text>
                        </View>
                    </>
                )}

                {!isUndefined(transaction.TransferFee) && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.transferFee')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{transaction.TransferFee}%</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default NFTokenMintTemplate;
