import Localize from '@locale';

import Ticket from '@common/libs/ledger/objects/Ticket/TicketClass';

/* Descriptor ==================================================================== */
const TicketInfo = {
    getLabel: (object: Ticket): string => {
        return `${Localize.t('global.ticket')} #${object.TicketSequence}`;
    },

    getDescription: (object: Ticket): string => {
        return `${Localize.t('global.ticketSequence')} #${object.TicketSequence}`;
    },

    getRecipient: (object: Ticket) => {
        return object.Account;
    },
};

/* Export ==================================================================== */
export default TicketInfo;
