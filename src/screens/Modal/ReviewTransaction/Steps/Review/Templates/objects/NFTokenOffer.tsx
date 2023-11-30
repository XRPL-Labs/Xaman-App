import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import LedgerService from '@services/LedgerService';

import { NFTokenMint } from '@common/libs/ledger/transactions';
import { NFTokenOffer } from '@common/libs/ledger/objects';
import Flag from '@common/libs/ledger/parser/common/flag';

import { AmountText, LoadingIndicator, InfoMessage } from '@components/General';
import { AccountElement } from '@components/Modules';

import { FormatDate } from '@common/utils/date';
import { DecodeNFTokenID } from '@common/utils/codec';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    nfTokenOffer: string;
}

export interface State {
    object: NFTokenOffer;
    isTokenBurnable: any;
    isLoading: boolean;
}

/* Component ==================================================================== */
class NFTokenOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            object: undefined,
            isTokenBurnable: false,
            isLoading: true,
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

    render() {
        const { object, isTokenBurnable, isLoading } = this.state;

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
                        <AccountElement
                            address={object.Destination.address}
                            tag={object.Destination.tag}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {object.Owner && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.owner')}</Text>
                        <AccountElement
                            address={object.Owner}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
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
