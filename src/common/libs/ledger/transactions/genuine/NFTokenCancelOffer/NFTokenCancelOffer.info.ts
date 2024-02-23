import Localize from '@locale';

import { AccountModel } from '@store/models';

import NFTokenCancelOffer from './NFTokenCancelOffer.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class NFTokenCancelOfferInfo extends ExplainerAbstract<NFTokenCancelOffer> {
    constructor(item: NFTokenCancelOffer & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.cancelNFTOffer');
    }

    generateDescription(): string {
        const content = [];

        content.push(Localize.t('events.theTransactionWillCancelNftOffer', { address: this.item.Account }));

        this.item.NFTokenOffers?.forEach((offerId: string) => {
            content.push(`${offerId}`);
        });

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
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default NFTokenCancelOfferInfo;
