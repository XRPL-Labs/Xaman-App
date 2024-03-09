import Localize from '@locale';

import { AccountModel } from '@store/models';

import TicketCreate from './TicketCreate.class';

/* Types ==================================================================== */
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Descriptor ==================================================================== */
class TicketCreateInfo extends ExplainerAbstract<TicketCreate, MutationsMixinType> {
    constructor(item: TicketCreate & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return Localize.t('events.createTicket');
    }

    generateDescription(): string {
        const { TicketCount, TicketsSequence } = this.item;

        const contentArray: string[] = [];

        contentArray.push(Localize.t('events.itCreatesTicketForThisAccount', { ticketCount: TicketCount }));
        contentArray.push(Localize.t('events.createdTicketsSequence', { ticketsSequence: TicketsSequence.join(', ') }));

        return contentArray.join('\n');
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
export default TicketCreateInfo;
