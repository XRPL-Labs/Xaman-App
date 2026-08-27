import React, { Component } from 'react';
import { View, Text, InteractionManager } from 'react-native';

import LedgerService from '@services/LedgerService';

import { NFTokenAcceptOffer, NFTokenCancelOffer, NFTokenMint } from '@common/libs/ledger/transactions';
import { NFTokenOffer } from '@common/libs/ledger/objects';
import { NFTokenOffer as LedgerNFTokenOffer } from '@common/libs/ledger/types/ledger';
import FlagParser from '@common/libs/ledger/parser/common/flag';

import { AccountModel } from '@store/models';

import { AmountText, LoadingIndicator, InfoMessage } from '@components/General';
import { AccountElement, NFTokenElement } from '@components/Modules';

import { FormatDate } from '@common/utils/date';
import { DecodeNFTokenID } from '@common/utils/codec';

import Localize from '@locale';

import styles from './styles';
import { AppStyles } from '@theme/index';
import BackendService from '@services/BackendService';
import { CoreRepository } from '@store/repositories';
import NetworkService from '@services/NetworkService';

/* types ==================================================================== */
export interface Props {
    source: AccountModel;
    nfTokenOffer: string;
    transaction?: NFTokenAcceptOffer | NFTokenCancelOffer;
}

export interface State {
    object?: NFTokenOffer;
    isTokenBurnable: any;
    isLoading: boolean;
    wantsPercentage?: number;
    wantsValue?: string;
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
        const { transaction } = this.props;

        const settings = await CoreRepository.getSettings();

        const [, accountWorth, currencyRate] = await Promise.all([
            this.fetchObject(),
            BackendService.getAccountWorth(
                transaction!.Account,
                settings.network.key,
                settings.currency,
                'NFTOKENOFFER_ACCEPT',
            ),
            BackendService.getCurrencyRate(settings.currency),
        ]);

        // check if token is burnable
        this.checkTokenBurnable();

        const { object } = this.state;

        if (object && object!?.Amount) {
            const amount = object!.Amount;
            const nativeAsset = NetworkService.getNativeAsset();

            const lineItems: {
                issuer: string;
                asset: string;
                amount: number;
                value?: number;
            }[] = accountWorth?.lineItems || [];

            if (typeof amount !== 'string') {
                let matchingAWItem;
                if (amount?.currency === nativeAsset) {
                    matchingAWItem = lineItems
                        .filter(l => l.issuer === 'rrrrrrrrrrrrrrrrrrrrrrrhoLvTp')
                        .filter(l => l.asset === nativeAsset);
                } else {
                    matchingAWItem = lineItems
                        .filter(l => l.issuer === amount.issuer)
                        .filter(l => l.asset === amount.currency);
                }
                if (Array.isArray(matchingAWItem) && matchingAWItem.length > 0) {
                    const matchingAWItemAmount = matchingAWItem[0].amount;
                    const wantsPercentage = Math.round(Number(amount.value) / Number(matchingAWItemAmount) * 100);
                    const ff = Localize.formatNumber(
                        Number(matchingAWItem[0]?.value), Number(matchingAWItem[0]?.value) > 1000 ? 0 : 2, true,
                    );
                    this.setState({
                        wantsPercentage,
                        wantsValue: `${currencyRate.code || settings.currency} ${currencyRate.symbol} ${ff}`,
                    });
                }
            }
            // console.log('accountWorth', );
        }
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

            LedgerService.getLedgerEntry<LedgerNFTokenOffer>({ index: nfTokenOffer })
                .then((resp) => {
                    if ('error' in resp) {
                        this.setState({ isLoading: false }, resolve);
                        return;
                    }

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

        if (!object || !object.NFTokenID) {
            return;
        }

        const { Flags: FlagsInt } = DecodeNFTokenID(object.NFTokenID);

        const flags = new FlagParser(NFTokenMint.Type, FlagsInt);
        const parsedFlags = flags.get();

        if (parsedFlags?.Burnable) {
            this.setState({
                isTokenBurnable: true,
            });
        }
    };

    render() {
        const { source, transaction } = this.props;
        const { object, isTokenBurnable, isLoading, wantsPercentage, wantsValue } = this.state;

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
                    onActionButtonPress={this.fetchDetails}
                />
            );
        }

        const isAboutToPay = String(transaction?.TransactionType).match(/accept/i) &&
            object?.Flags?.lsfSellNFToken &&
            ((transaction || {}) as any)?.NFTokenSellOffer &&
            Number(object?.Amount?.value || 0) > 0;

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
                        <Text style={styles.label}>{
                            isAboutToPay
                                ? Localize.t('global.amountToPay')
                                : Localize.t('global.amount')
                        }</Text>
                        <View style={[
                            styles.contentBox,
                            isAboutToPay && styles.sellingAmount,
                        ]}>
                            {isAboutToPay && (
                                <View style={[
                                    AppStyles.row,
                                    styles.nftSellPrefixContainer,
                                ]}>
                                    <Text style={[
                                        AppStyles.pbold,
                                        AppStyles.baseText,
                                        AppStyles.colorRed,
                                    ]}>
                                        {Localize.t('global.youWillPay')}
                                    </Text>
                                </View>
                            )}
                            <AmountText
                                value={object!.Amount.value}
                                currency={object!.Amount.currency}
                                style={[
                                    isAboutToPay
                                        ? styles.amount // Red
                                        : AppStyles.colorPrimary, // white/dark mode invert
                                ]}
                                immutable
                            />
                        </View>
                        {isAboutToPay && (Number(wantsPercentage || 0) || 0) > 50 && (
                            <View style={AppStyles.marginBottom}>
                                <InfoMessage
                                    icon="IconInfo"
                                    type="warning"
                                    label={Localize.t('payloadRiskWarning.thisOfferConsumesPercentage', {
                                        wantsPercentage: `${wantsValue} / ${wantsPercentage}`,
                                    })}
                                />
                            </View>
                        )}
                    </>
                )}

                {object!.NFTokenID && (
                    <>
                        <Text style={styles.label}>{
                            isAboutToPay
                                ? Localize.t('global.nftToBuy')
                                : Localize.t('global.nft')
                        }</Text>
                        <View style={styles.contentBox}>
                            <NFTokenElement
                                account={source.address}
                                nfTokenId={object!.NFTokenID}
                                truncate={false}
                                containerStyle={styles.nfTokenContainer}
                            />
                        </View>
                    </>
                )}

                {object!.Expiration && (
                    <>
                        <Text style={styles.label}>{Localize.t('global.expireAfter')}</Text>
                        <View style={styles.contentBox}>
                            <Text style={styles.value}>{FormatDate(object!.Expiration)}</Text>
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
