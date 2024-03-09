import Localize from '@locale';

import { AccountModel } from '@store/models';

import NFTokenBurn from './NFTokenBurn.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */

class NFTokenBurnInfo extends ExplainerAbstract<NFTokenBurn, MutationsMixinType> {
    constructor(item: NFTokenBurn & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.burnNFT');
    }

    generateDescription(): string {
        return Localize.t('events.nfTokenBurnExplain', { tokenID: this.item.NFTokenID });
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
export default NFTokenBurnInfo;
