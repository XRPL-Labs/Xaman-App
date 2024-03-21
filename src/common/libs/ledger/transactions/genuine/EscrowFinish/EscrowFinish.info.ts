import Localize from '@locale';

import { AccountModel } from '@store/models';

import EscrowFinish from './EscrowFinish.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract, MonetaryStatus } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class EscrowFinishInfo extends ExplainerAbstract<EscrowFinish, MutationsMixinType> {
    constructor(item: EscrowFinish & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.finishEscrow');
    }

    generateDescription(): string {
        const content = [
            Localize.t('events.escrowFinishExplain', {
                address: this.item.Account,
                amount: this.item.Escrow.Amount!.value,
                currency: this.item.Escrow.Amount!.currency,
                destination: this.item.Escrow.Destination,
            }),
        ];

        if (typeof this.item.Escrow.DestinationTag !== 'undefined') {
            content.push(Localize.t('events.theEscrowHasADestinationTag', { tag: this.item.Escrow.DestinationTag }));
        }

        if (typeof this.item.EscrowID !== 'undefined') {
            content.push(Localize.t('events.theTransactionHasAEscrowId', { escrowId: this.item.EscrowID }));
        }

        content.push(Localize.t('events.theEscrowWasCreatedBy', { owner: this.item.Owner }));

        return content.join('\n');
    }

    getParticipants() {
        return {
            start: { address: this.item.Owner, tag: undefined },
            end: { address: this.item.Escrow.Destination, tag: this.item.Escrow.DestinationTag },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: this.item.BalanceChange(this.account.address),
            factor: {
                currency: this.item.Escrow!.Amount!.currency,
                value: this.item.Escrow!.Amount!.value,
                effect:
                    this.item.Account === this.account.address
                        ? MonetaryStatus.IMMEDIATE_EFFECT
                        : MonetaryStatus.NO_EFFECT,
            },
        };
    }
}

/* Export ==================================================================== */
export default EscrowFinishInfo;
