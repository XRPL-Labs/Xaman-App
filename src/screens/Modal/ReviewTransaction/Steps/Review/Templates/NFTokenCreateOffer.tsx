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

import { TemplateProps } from './types';
/* types ==================================================================== */
export interface Props extends Omit<TemplateProps, 'transaction'> {
    transaction: NFTokenCreateOffer;
}

export interface State {
    isLoadingDestinationDetails: boolean;
    isLoadingOwnerDetails: boolean;
    destinationDetails: AccountNameType;
    ownerDetails: AccountNameType;
}

/* Component ==================================================================== */
class NFTokenCreateOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            isLoadingDestinationDetails: true,
            isLoadingOwnerDetails: true,
            destinationDetails: undefined,
            ownerDetails: undefined,
        };
    }

    componentDidMount() {
        const { transaction } = this.props;

        if (transaction.Destination) {
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

        if (transaction.Owner) {
            getAccountName(transaction.Owner)
                .then((res: any) => {
                    if (!isEmpty(res)) {
                        this.setState({
                            ownerDetails: res,
                        });
                    }
                })
                .catch(() => {
                    // ignore
                })
                .finally(() => {
                    this.setState({
                        isLoadingOwnerDetails: false,
                    });
                });
        }
    }

    render() {
        const { transaction } = this.props;
        const { isLoadingDestinationDetails, isLoadingOwnerDetails, ownerDetails, destinationDetails } = this.state;

        return (
            <>
                {transaction.Destination && (
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
                    </>
                )}

                {transaction.Owner && (
                    <>
                        <View style={styles.label}>
                            <Text style={[AppStyles.subtext, AppStyles.bold, AppStyles.colorGrey]}>
                                {Localize.t('global.owner')}
                            </Text>
                        </View>
                        <RecipientElement
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                            isLoading={isLoadingOwnerDetails}
                            recipient={{
                                address: transaction.Owner,
                                ...ownerDetails,
                            }}
                        />
                    </>
                )}

                {transaction.Amount && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.amount')}</Text>
                        <View style={[styles.contentBox]}>
                            <AmountText
                                value={transaction.Amount.value}
                                currency={transaction.Amount.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {transaction.NFTokenID && (
                    <>
                        <Text style={[styles.label]}>{Localize.t('global.tokenID')}</Text>
                        <View style={[styles.contentBox]}>
                            <Text style={[styles.value]}>{transaction.NFTokenID}</Text>
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
            </>
        );
    }
}

export default NFTokenCreateOfferTemplate;
