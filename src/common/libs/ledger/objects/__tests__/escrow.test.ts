/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { Escrow, EscrowInfo } from '../Escrow';
import escrowObjectTemplate from './fixtures/EscrowObject.json';

jest.mock('@services/NetworkService');

describe('Escrow object', () => {
    describe('Class', () => {
        it('Should return right parsed values', () => {
            const object: any = escrowObjectTemplate;
            const instance = new Escrow(object);

            expect(instance.Type).toBe('Escrow');
            expect(instance.LedgerEntryType).toBe('Escrow');
            expect(instance.Account).toEqual('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.DestinationTag).toEqual(23480);
            expect(instance.SourceTag).toEqual(1337);

            expect(instance.Amount).toStrictEqual({
                currency: 'XRP',
                value: '0.01',
            });
            expect(instance.Condition).toBe(
                'A0258020A82A88B2DF843A54F58772E4A3861866ECDB4157645DD9AE528C1D3AEEDABAB6810120',
            );
            expect(instance.CancelAfter).toBe('2017-04-13T23:10:32.000Z');
            expect(instance.FinishAfter).toBe('2017-04-12T23:15:32.000Z');
        });
    });

    describe('Info', () => {
        const object: any = escrowObjectTemplate;
        const instance = new Escrow(object);
        const info = new EscrowInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The escrow is from rrrrrrrrrrrrrrrrrrrrrholvtp to rrrrrrrrrrrrrrrrrrrrbzbvji${'\n'}The escrow has a destination tag: 23480${'\n'}It escrowed 0.01 XRP${'\n'}It can be cancelled after Friday, April 14, 2017 1:10 AM${'\n'}It can be finished after Thursday, April 13, 2017 1:15 AM`;

                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('global.escrow'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: 1337 },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrbzbvji', tag: 23480 },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: undefined,
                    factor: { currency: 'XRP', value: '0.01', effect: 1 },
                });
            });
        });
    });

    describe('Validation', () => {});
});
