import Localize from '@locale';

import { AccountModel } from '@store/models';

import MPTokenIssuanceSet from './MPTokenIssuanceSet.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class MPTokenIssuanceSetInfo extends ExplainerAbstract<MPTokenIssuanceSet, MutationsMixinType> {
    constructor(item: MPTokenIssuanceSet & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('events.mpTokenIssuanceSet');
    };

    generateDescription = (): string => {
        return `This is an ${this.item.Type} transaction`;
    };

    getParticipants = () => {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
        };
    };

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default MPTokenIssuanceSetInfo;
