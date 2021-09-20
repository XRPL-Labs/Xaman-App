/* eslint-disable react/jsx-one-expression-per-line */

import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenCreateOffer } from '@common/libs/ledger/transactions';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import Localize from '@locale';

import { AmountText } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { FormatDate } from '@common/utils/date';

import { AppStyles } from '@theme';
import styles from './styles';

/* types ==================================================================== */
export interface Props {
    transaction: NFTokenCreateOffer;
}

export interface State {
    isLoadingDestinationDetails: boolean;
    destinationDetails: AccountNameType;
}

/* Component ==================================================================== */
class NFTokenMintTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoadingDestinationDetails: true,
            destinationDetails: {
                name: '',
                source: '',
            },
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        getAccountName(transaction.Destination.address)
            .then((res: any) => {
                if (!isEmpty(res)) {
                    this.setState({
                        destinationDetails: res,
                    });
                }
            })
            .catch(() => {
                // ignore
            })
            .finally(() => {
                this.setState({
                    isLoadingDestinationDetails: false,
                });
            });
    }

    render() {
        const { transaction } = this.props;
        const { isLoadingDestinationDetails, destinationDetails } = this.state;

        return (
            <>
                <View style={styles.label}>
                    <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                        {Localize.t('global.destination')}
                    </Text>
                </View>
                <RecipientElement
                    containerStyle={[styles.contentBox, styles.addressContainer]}
                    isLoading={isLoadingDestinationDetails}
                    recipient={{
                        address: transaction.Destination.address,
                        ...destinationDetails,
                    }}
                />

                <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>
                <View style={[styles.contentBox]}>
                    <AmountText
                        value={transaction.Amount.value}
                        postfix={transaction.Amount.currency}
                        style={styles.amount}
                    />
                </View>

                <Text style={[styles.label]}>{Localize.t('global.tokenID')}</Text>
                <View style={[styles.contentBox]}>
                    <Text style={[styles.value]}>{transaction.TokenID}</Text>
                </View>

                {transaction.Expiration && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.expireAfter')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{FormatDate(transaction.Expiration)}</Text>
                        </View>
                    </>
                )}

                {transaction.Owner && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.owner')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{transaction.Owner}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default NFTokenMintTemplate;
