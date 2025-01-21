import Localize from '@locale';

import { AccountModel } from '@store/models';

import MPTokenAuthorize from './MPTokenAuthorize.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class MPTokenAuthorizeInfo extends ExplainerAbstract<MPTokenAuthorize, MutationsMixinType> {
    constructor(item: MPTokenAuthorize & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('events.mpTokenAuthorize');
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
export default MPTokenAuthorizeInfo;
