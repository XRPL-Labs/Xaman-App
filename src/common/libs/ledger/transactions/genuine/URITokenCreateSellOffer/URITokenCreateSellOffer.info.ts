import Localize from '@locale';

import { AccountModel } from '@store/models';

import URITokenCreateSellOffer from './URITokenCreateSellOffer.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { AssetDetails, AssetTypes, ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class URITokenCreateSellOfferInfo extends ExplainerAbstract<URITokenCreateSellOffer, MutationsMixinType> {
    constructor(item: URITokenCreateSellOffer & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.createURITokenSellOffer');
    }

    generateDescription(): string {
        const { URITokenID, Destination, Amount } = this.item;

        const content: string[] = [];

        content.push(
            Localize.t('events.uriTokenSellOfferExplain', {
                address: this.item.Account,
                uriToken: URITokenID,
                value: Amount!.value,
                currency: Amount!.currency,
            }),
        );

        if (typeof Destination !== 'undefined') {
            content.push(
                Localize.t('events.thisURITokenOfferMayOnlyBeAcceptedBy', {
                    address: Destination,
                }),
            );
        }

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Destination, tag: undefined },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: [
                {
                    ...this.item.Amount!,
                    effect: MonetaryStatus.POTENTIAL_EFFECT,
                    action: this.item.Account === this.account.address ? OperationActions.INC : OperationActions.DEC,
                },
            ],
        };
    }

    getAssetDetails(): AssetDetails[] {
        return [{ type: AssetTypes.URIToken, owner: this.item.Account, uriTokenId: this.item.URITokenID! }];
    }
}

export default URITokenCreateSellOfferInfo;
