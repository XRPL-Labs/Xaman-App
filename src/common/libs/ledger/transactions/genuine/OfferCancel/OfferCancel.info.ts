import Localize from '@locale';

import { AccountModel } from '@store/models';

import OfferCancel from './OfferCancel.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class OfferCancelInfo extends ExplainerAbstract<OfferCancel, MutationsMixinType> {
    constructor(item: OfferCancel & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('events.cancelOffer');
    };

    generateDescription = (): string => {
        const content = [
            Localize.t('events.theTransactionWillCancelOffer', {
                address: this.item.Account,
                offerSequence: this.item.OfferSequence,
            }),
        ];

        if (typeof this.item.OfferID !== 'undefined') {
            content.push(Localize.t('events.theTransactionHasAOfferId', { offerId: this.item.OfferID }));
        }

        return content.join('\n');
    };

    getParticipants = () => {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
        };
    };

    getMonetaryDetails = () => {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    };
}

/* Export ==================================================================== */
export default OfferCancelInfo;
