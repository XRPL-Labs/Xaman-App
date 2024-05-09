import moment from 'moment-timezone';

import { NormalizeCurrencyCode } from '@common/utils/monetary';

import { AccountModel } from '@store/models';

import Localize from '@locale';

import NFTokenCreateOffer from './NFTokenCreateOffer.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { AssetDetails, AssetTypes, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class NFTokenCreateOfferInfo extends ExplainerAbstract<NFTokenCreateOffer, MutationsMixinType> {
    constructor(item: NFTokenCreateOffer & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.createNFTOffer');
    }

    generateDescription(): string {
        const content = [];

        if (this.item.Flags?.SellToken) {
            content.push(
                Localize.t('events.nftOfferSellExplain', {
                    address: this.item.Account,
                    tokenID: this.item.NFTokenID,
                    amount: this.item.Amount!.value,
                    currency: NormalizeCurrencyCode(this.item.Amount!.currency),
                }),
            );
        } else {
            content.push(
                Localize.t('events.nftOfferBuyExplain', {
                    address: this.item.Account,
                    tokenID: this.item.NFTokenID,
                    amount: this.item.Amount!.value,
                    currency: NormalizeCurrencyCode(this.item.Amount!.currency),
                }),
            );
        }

        if (this.item.Owner) {
            content.push(Localize.t('events.theNftOwnerIs', { address: this.item.Owner }));
        }

        if (this.item.Destination) {
            content.push(Localize.t('events.thisNftOfferMayOnlyBeAcceptedBy', { address: this.item.Destination }));
        }

        if (this.item.Expiration) {
            content.push(
                Localize.t('events.theOfferExpiresAtUnlessCanceledOrAccepted', {
                    expiration: moment(this.item.Expiration).format('LLLL'),
                }),
            );
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: this.item.Destination ? { address: this.item.Destination, tag: undefined } : undefined,
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: [
                {
                    currency: this.item.Amount!.currency,
                    value: this.item.Amount!.value,
                    effect: MonetaryStatus.POTENTIAL_EFFECT,
                    action: this.item.Flags?.SellToken ? OperationActions.INC : OperationActions.DEC,
                },
            ],
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.NFToken, nfTokenId: this.item.NFTokenID }];
    }
}

/* Export ==================================================================== */
export default NFTokenCreateOfferInfo;
