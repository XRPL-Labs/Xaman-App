/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { Ticket, TicketInfo } from '../Ticket';
import ticketObjectTemplate from './fixtures/TicketObject.json';

jest.mock('@services/NetworkService');

describe('Ticket object', () => {
    describe('Class', () => {
        it('Should return right parsed values', () => {
            const object: any = ticketObjectTemplate;
            const instance = new Ticket(object);

            expect(instance.Type).toBe('Ticket');
            expect(instance.LedgerEntryType).toBe('Ticket');
            expect(instance.Account).toEqual('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.TicketSequence).toEqual(3);
        });
    });

    describe('Info', () => {
        const object: any = ticketObjectTemplate;
        const instance = new Ticket(object);
        const info = new TicketInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'Ticket Sequence #3';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(`${Localize.t('global.ticket')} #3`);
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
