import Localize from '@locale';

import { AccountModel } from '@store/models';

import Ticket from './Ticket.class';

/* Types ==================================================================== */
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { MutationsMixinType } from '@common/libs/ledger/mixin/types';

/* Descriptor ==================================================================== */
class TicketInfo extends ExplainerAbstract<Ticket> {
    constructor(item: Ticket & MutationsMixinType, account: AccountModel) {
        super(item, account);
    }

    getEventsLabel(): string {
        return `${Localize.t('global.ticket')} #${this.item.TicketSequence}`;
    }

    generateDescription(): string {
        return `${Localize.t('global.ticketSequence')} #${this.item.TicketSequence}`;
    }

    getParticipants() {
        return {
            start: { address: this.item.Account },
        };
    }

    getMonetaryDetails() {
        return undefined;
    }
}

/* Export ==================================================================== */
export default TicketInfo;
