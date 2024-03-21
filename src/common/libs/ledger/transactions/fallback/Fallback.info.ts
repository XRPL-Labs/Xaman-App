import { AccountModel } from '@store/models';

import Fallback from './Fallback.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class FallbackInfo extends ExplainerAbstract<Fallback, MutationsMixinType> {
    constructor(item: Fallback & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return this.item.TransactionType;
    }

    generateDescription(): string {
        return `This is an ${this.item.TransactionType} transaction`;
    }

    getParticipants() {
        return {};
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default FallbackInfo;
