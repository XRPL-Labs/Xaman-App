import Localize from '@locale';

import { AccountModel } from '@store/models';

import URITokenCreateSellOffer from './URITokenCreateSellOffer.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class URITokenCreateSellOfferInfo extends ExplainerAbstract<URITokenCreateSellOffer> {
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
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: {
                currency: this.item.Amount!.currency,
                value: this.item.Amount!.value,
                effect: MonetaryStatus.POTENTIAL_EFFECT,
            },
        };
    }
}

export default URITokenCreateSellOfferInfo;
