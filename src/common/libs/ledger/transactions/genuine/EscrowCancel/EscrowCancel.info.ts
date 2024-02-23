import Localize from '@locale';

import { AccountModel } from '@store/models';

import EscrowCancel from './EscrowCancel.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class EscrowCancelInfo extends ExplainerAbstract<EscrowCancel & MutationsMixinType> {
    constructor(item: EscrowCancel & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel = (): string => {
        return Localize.t('events.cancelEscrow');
    };

    generateDescription = (): string => {
        const content = [`This is an ${this.item.Type} transaction`];

        if (this.item.EscrowID) {
            content.push(Localize.t('events.theTransactionHasAEscrowId', { escrowId: this.item.EscrowID }));
        }

        return content.join('\n');
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
export default EscrowCancelInfo;
