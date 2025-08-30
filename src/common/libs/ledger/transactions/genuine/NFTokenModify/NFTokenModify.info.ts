import Localize from '@locale';

import { AccountModel } from '@store/models';

import NFTokenModify from './NFTokenModify.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */

class NFTokenModifyInfo extends ExplainerAbstract<NFTokenModify, MutationsMixinType> {
    constructor(item: NFTokenModify & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.modifyNFT');
    }

    generateDescription(): string {
        return Localize.t('events.nfTokenModifyExplain', {
            tokenID: this.item.NFTokenID,
            uri: this.item?.URI || Localize.t('events.nfTokenModifyExplainUnchangedURI'),
        });
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.item.Owner, tag: this.item.SourceTag },
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
export default NFTokenModifyInfo;
