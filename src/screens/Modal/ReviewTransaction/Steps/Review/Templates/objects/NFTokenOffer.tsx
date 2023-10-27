import { isEmpty } from 'lodash';

import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import LedgerService from '@services/LedgerService';

import { NFTokenMint } from '@common/libs/ledger/transactions';
import { NFTokenOffer } from '@common/libs/ledger/objects';
import Flag from '@common/libs/ledger/parser/common/flag';

import { getAccountName, AccountNameType } from '@common/helpers/resolver';

import Localize from '@locale';

import { AmountText, LoadingIndicator, InfoMessage } from '@components/General';
import { RecipientElement } from '@components/Modules';

import { FormatDate } from '@common/utils/date';
import { DecodeNFTokenID } from '@common/utils/codec';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    nfTokenOffer: string;
}

export interface State {
    object: NFTokenOffer;
    isTokenBurnable: any;
    isLoading: boolean;
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
            object: undefined,
            isTokenBurnable: false,
            isLoading: true,
            isLoadingDestinationDetails: true,
            isLoadingOwnerDetails: true,
            destinationDetails: undefined,
            ownerDetails: undefined,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchDetails);
    }

    fetchDetails = async () => {
        // fetch the object first
        await this.fetchObject();

        // check if token is burnable
        this.checkTokenBurnable();

        // fetch parties details
        this.fetchPartiesDetails();
    };

    fetchObject = () => {
        const { nfTokenOffer } = this.props;
        const { isLoading } = this.state;

        return new Promise((resolve: any) => {
            // set loading if not set already
            if (!isLoading) {
                this.setState({
                    isLoading: true,
                });
            }

            LedgerService.getLedgerEntry({ index: nfTokenOffer })
                .then((resp) => {
                    let object;

                    if (resp?.node?.LedgerEntryType === NFTokenOffer.Type) {
                        object = new NFTokenOffer(resp.node);
                    }

                    this.setState(
                        {
                            isLoading: false,
                            object,
                        },
                        resolve,
                    );
                })
                .catch(() => {
                    this.setState({ isLoading: false }, resolve);
                });
        });
    };

    checkTokenBurnable = () => {
        const { object } = this.state;

        if (!object) {
            return;
        }

        if (object.NFTokenID) {
            const { Flags: FlagsInt } = DecodeNFTokenID(object.NFTokenID);

            const flags = new Flag(NFTokenMint.Type, FlagsInt);
            const parsedFlags = flags.parse();

            if (parsedFlags?.Burnable) {
                this.setState({
                    isTokenBurnable: true,
                });
            }
        }
    };

    fetchPartiesDetails = () => {
        const { object } = this.state;

        // no object found
        if (!object) {
            return;
        }

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
    };

    render() {
        const {
            object,
            isTokenBurnable,
            isLoading,
            isLoadingDestinationDetails,
            isLoadingOwnerDetails,
            ownerDetails,
            destinationDetails,
        } = this.state;

        if (isLoading) {
            return <LoadingIndicator />;
        }

        if (!isLoading && !object) {
            return (
                <InfoMessage
                    type="error"
                    flat
                    label={Localize.t('payload.unableToFindTheOfferObject')}
                    actionButtonLabel={Localize.t('global.tryAgain')}
                    actionButtonIcon="IconRefresh"
                    onActionButtonPress={this.fetchDetails}
                />
            );
        }

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

                {isTokenBurnable && (
                    <InfoMessage icon="IconInfo" type="info" label={Localize.t('payload.theIssuerCanBurnThisToken')} />
                )}
            </>
        );
    }
}

export default NFTokenOfferTemplate;
