import Localize from '@locale';

import { AccountModel } from '@store/models';

import CheckCancel from './CheckCancel.class';

/* types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class CheckCancelInfo extends ExplainerAbstract<CheckCancel, MutationsMixinType> {
    constructor(item: CheckCancel & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('events.cancelCheck');
    };

    generateDescription = (): string => {
        return Localize.t('events.theTransactionWillCancelCheckWithId', { checkId: this.item.CheckID });
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

/* Export ==================================
================================== */
export default CheckCancelInfo;
