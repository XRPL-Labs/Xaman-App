import Localize from '@locale';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import NFTokenAcceptOffer from './NFTokenAcceptOffer.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus, AssetDetails, AssetTypes } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class NFTokenAcceptOfferInfo extends ExplainerAbstract<NFTokenAcceptOffer, MutationsMixinType> {
    constructor(item: NFTokenAcceptOffer & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.acceptNFTOffer');
    }

    generateDescription(): string {
        const offerID = this.item.NFTokenBuyOffer || this.item.NFTokenSellOffer;

        const content = [];

        if (this.item.Offer) {
            if (this.item.Offer.Flags?.tfSellToken) {
                content.push(
                    Localize.t('events.nftAcceptOfferBuyExplanation', {
                        address: this.item.Account,
                        offerID,
                        tokenID: this.item.Offer.NFTokenID,
                        amount: this.item.Offer.Amount!.value,
                        currency: NormalizeCurrencyCode(this.item.Offer.Amount!.currency),
                    }),
                );
            } else {
                content.push(
                    Localize.t('events.nftAcceptOfferSellExplanation', {
                        address: this.item.Account,
                        offerID,
                        tokenID: this.item.Offer.NFTokenID,
                        amount: this.item.Offer.Amount!.value,
                        currency: NormalizeCurrencyCode(this.item.Offer.Amount!.currency),
                    }),
                );
            }
        }

        if (typeof this.item.NFTokenBrokerFee !== 'undefined') {
            content.push(
                Localize.t('events.nftAcceptOfferBrokerFee', {
                    brokerFee: this.item.NFTokenBrokerFee.value,
                    currency: NormalizeCurrencyCode(this.item.NFTokenBrokerFee.currency),
                }),
            );
        }

        return content.join('\n');
    }

    getParticipants() {
        const seller = this.item.Offer.Owner;
        const buyer = this.item.Account;
        const isSellOffer = this.item.Offer.Flags?.tfSellToken;

        return {
            start: { address: isSellOffer ? buyer : seller },
            end: { address: isSellOffer ? seller : buyer },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: [
                {
                    currency: this.item.Offer.Amount!.currency,
                    value: this.item.Offer.Amount!.value,
                    effect: MonetaryStatus.IMMEDIATE_EFFECT,
                    action: this.item.Offer.Flags?.tfSellToken ? OperationActions.INC : OperationActions.DEC,
                },
            ],
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.NFToken, nfTokenId: this.item.Offer.NFTokenID! }];
    }
}

/* Export ==================================================================== */
export default NFTokenAcceptOfferInfo;
