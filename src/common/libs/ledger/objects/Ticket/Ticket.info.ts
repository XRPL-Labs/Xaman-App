import Localize from '@locale';

import { AccountModel } from '@store/models';

import Ticket from './Ticket.class';

/* Types ==================================================================== */
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';
import { OperationActions } from '@common/libs/ledger/parser/types';

/* Descriptor ==================================================================== */
class TicketInfo extends ExplainerAbstract<Ticket> {
    constructor(item: Ticket, account: AccountModel) {
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
            start: { address: this.item.Account, tag: undefined },
        };
    }

    getMonetaryDetails() {
        return {
            mutate: {
                [OperationActions.INC]: [],
                [OperationActions.DEC]: [],
            },
            factor: undefined,
        };
    }
}

/* Export ==================================================================== */
export default TicketInfo;
