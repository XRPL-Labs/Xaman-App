/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { TicketCreate, TicketCreateInfo } from '../TicketCreate';
import ticketCreateTemplate from './fixtures/TicketCreateTx.json';

jest.mock('@services/NetworkService');

describe('TicketCreate tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new TicketCreate();
            expect(instance.TransactionType).toBe('TicketCreate');
            expect(instance.Type).toBe('TicketCreate');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = ticketCreateTemplate;
                const instance = new TicketCreate(tx, meta);

                const expectedDescription = `${Localize.t('events.itCreatesTicketForThisAccount', {
                    ticketCount: instance.TicketCount,
                })}\n\n${Localize.t('events.createdTicketsSequence', {
                    ticketsSequence: instance.TicketsSequence.join(', '),
                })}`;

                expect(TicketCreateInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(TicketCreateInfo.getLabel()).toEqual(Localize.t('events.createTicket'));
            });
        });
    });

    describe('Validation', () => {});
});
