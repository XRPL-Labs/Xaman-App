/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import TicketCreate from '../ticketCreate';

describe('TicketCreate tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new TicketCreate();
        expect(instance.TransactionType).toBe('TicketCreate');
        expect(instance.Type).toBe('TicketCreate');
    });
});
