/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

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

        it('Should return right parsed values', () => {
            const { tx, meta }: any = ticketCreateTemplate;
            const instance = new TicketCreate(tx, meta);

            expect(instance.TicketCount).toBe(10);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = ticketCreateTemplate;
        const Mixed = MutationsMixin(TicketCreate);
        const instance = new Mixed(tx, meta);
        const info = new TicketCreateInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription =
                    'It creates 10 ticket(s) for this account.\nCreated tickets sequence 70035199';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });
        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createTicket'));
            });
        });
    });

    describe('Validation', () => {});
});
