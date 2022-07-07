/* eslint-disable react/jsx-one-expression-per-line */

import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text } from 'react-native';

import { NFTokenOffer } from '@common/libs/ledger/objects';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import Localize from '@locale';

import { AmountText } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { FormatDate } from '@common/utils/date';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    object: NFTokenOffer;
}

export interface State {
    isLoadingDestinationDetails: boolean;
    isLoadingOwnerDetails: boolean;
    destinationDetails: AccountNameType;
    ownerDetails: AccountNameType;
}

/* Component ==================================================================== */
class NFTokenOfferTemplate extends Component<Props, State> {
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
        const { object } = this.props;

        if (object.Destination) {
            getAccountName(object.Destination.address)
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

        if (object.Owner) {
            getAccountName(object.Owner)
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
        const { object } = this.props;
        const { isLoadingDestinationDetails, isLoadingOwnerDetails, ownerDetails, destinationDetails } = this.state;

        return (
            <>
                {object.Destination && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.destination')}</Text>
                        <RecipientElement
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                            isLoading={isLoadingDestinationDetails}
                            recipient={{
                                address: object.Destination.address,
                                ...destinationDetails,
                            }}
                        />
                    </>
                )}

                {object.Owner && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.owner')}</Text>
                        <RecipientElement
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                            isLoading={isLoadingOwnerDetails}
                            recipient={{
                                address: object.Owner,
                                ...ownerDetails,
                            }}
                        />
                    </>
                )}

                {object.Amount && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={object.Amount.value}
                                currency={object.Amount.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {object.NFTokenID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.tokenID')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{object.NFTokenID}</Text>
                        </View>
                    </>
                )}

                {object.Expiration && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.expireAfter')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(object.Expiration)}</Text>
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default NFTokenOfferTemplate;
