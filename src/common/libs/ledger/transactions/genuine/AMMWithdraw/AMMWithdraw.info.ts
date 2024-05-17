import Localize from '@locale';

import { AccountModel } from '@store/models';

import Meta from '@common/libs/ledger/parser/meta';

import AMMWithdraw from './AMMWithdraw.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class AMMWithdrawInfo extends ExplainerAbstract<AMMWithdraw, MutationsMixinType> {
    private readonly AmmAccountId: string;

    constructor(item: AMMWithdraw & MutationsMixinType, account: AccountModel) {
        super(item, account);

        this.AmmAccountId = new Meta(item.MetaData).parseAMMAccountID();
    }

    getEventsLabel(): string {
        return Localize.t('events.ammWithdraw');
    }

    generateDescription(): string {
        return `This is an ${this.item.Type} transaction`;
    }

    getParticipants() {
        return {
            start: { address: this.item.Account, tag: this.item.SourceTag },
            end: { address: this.AmmAccountId, tag: undefined },
        };
    }

    getMonetaryDetails() {
        // TODO: add factor
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default AMMWithdrawInfo;