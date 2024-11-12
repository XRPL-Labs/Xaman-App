import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import LedgerService from '@services/LedgerService';

import { URIToken } from '@common/libs/ledger/objects';
import { URIToken as LedgerURIToken } from '@common/libs/ledger/types/ledger';

import { AccountModel } from '@store/models';

import { AmountText, LoadingIndicator, InfoMessage } from '@components/General';
import { AccountElement, URITokenElement } from '@components/Modules';

import Localize from '@locale';

import styles from './styles';

/* types ==================================================================== */
export interface Props {
    source: AccountModel;
    uriTokenId: string;
}

export interface State {
    object?: URIToken;
    isLoading: boolean;
}

/* Component ==================================================================== */
class URITokenOfferTemplate extends Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            object: undefined,
            isLoading: true,
        };
    }

    componentDidMount() {
        InteractionManager.runAfterInteractions(this.fetchObject);
    }

    fetchObject = () => {
        const { uriTokenId } = this.props;
        const { isLoading } = this.state;

        return new Promise((resolve: any) => {
            // set loading if not set already
            if (!isLoading) {
                this.setState({
                    isLoading: true,
                });
            }

            LedgerService.getLedgerEntry<LedgerURIToken>({ index: uriTokenId })
                .then((resp) => {
                    if ('error' in resp) {
                        this.setState({ isLoading: false }, resolve);
                        return;
                    }

                    let object;

                    if (resp?.node?.LedgerEntryType === URIToken.Type) {
                        object = new URIToken(resp.node);
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

    render() {
        const { object, isLoading } = this.state;

        if (isLoading) {
            return <LoadingIndicator />;
        }

        if (!isLoading && !object) {
            return (
                <InfoMessage
                    flat
                    type="error"
                    label={Localize.t('payload.unableToFindTheOfferObject')}
                    actionButtonLabel={Localize.t('global.tryAgain')}
                    actionButtonIcon="IconRefresh"
                    onActionButtonPress={this.fetchObject}
                />
            );
        }

        return (
            <>
                {object!.Destination && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.destination')}</Text>
                        <AccountElement
                            address={object!.Destination}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {object!.Owner && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.owner')}</Text>
                        <AccountElement
                            address={object!.Owner}
                            containerStyle={[styles.contentBox, styles.addressContainer]}
                        />
                    </>
                )}

                {object!.Amount && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.amount')}</Text>
                        <View style={styles.contentBox}>
                            <AmountText
                                value={object!.Amount.value}
                                currency={object!.Amount.currency}
                                style={styles.amount}
                                immutable
                            />
                        </View>
                    </>
                )}

                {object!.URITokenID && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.uritoken')}</Text>
                        <View style={styles.contentBox}>
                            <URITokenElement
                                object={object}
                                truncate={false}
                                containerStyle={styles.uriTokenContainer}
                            />
                        </View>
                    </>
                )}
            </>
        );
    }
}

export default URITokenOfferTemplate;
