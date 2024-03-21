import Localize from '@locale';

import { AccountModel } from '@store/models';

import URITokenBurn from './URITokenBurn.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class URITokenBurnInfo extends ExplainerAbstract<URITokenBurn, MutationsMixinType> {
    constructor(item: URITokenBurn & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.burnURIToken');
    }

    generateDescription(): string {
        const { URITokenID } = this.item;

        return Localize.t('events.uriTokenBurnExplain', { tokenID: URITokenID });
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
export default URITokenBurnInfo;
