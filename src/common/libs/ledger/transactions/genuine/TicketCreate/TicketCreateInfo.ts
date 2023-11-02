import { AccountModel } from '@store/models';

import Localize from '@locale';

import TicketCreate from './TicketCreateClass';

/* Descriptor ==================================================================== */
const TicketCreateInfo = {
    getLabel: (): string => {
        return Localize.t('events.createTicket');
    },

    getDescription: (tx: TicketCreate): string => {
        let content = Localize.t('events.itCreatesTicketForThisAccount', { ticketCount: tx.TicketCount });
        content += '\n\n';
        content += Localize.t('events.createdTicketsSequence', { ticketsSequence: tx.TicketsSequence.join(', ') });
        return content;
    },

    getRecipient: (tx: TicketCreate, account: AccountModel): { address: string; tag?: number } => {
        if (tx.Account.address !== account.address) {
            return tx.Account;
        }
        return undefined;
    },
};

/* Export ==================================================================== */
export default TicketCreateInfo;
