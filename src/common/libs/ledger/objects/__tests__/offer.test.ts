/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { Offer, OfferInfo } from '../Offer';
import offerObjectTemplates from './fixtures/OfferObject.json';

jest.mock('@services/NetworkService');

describe('Offer object', () => {
    describe('Class', () => {
        it('Should return right parsed values for executed order XRP->IOU', () => {
            const object: any = offerObjectTemplates;
            const instance = new Offer(object);

            expect(instance.Type).toBe('Offer');
            expect(instance.LedgerEntryType).toBe('Offer');
            expect(instance.Account).toBe('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.OfferSequence).toBe(866);
            expect(instance.Rate).toBe(0.00046511627906976747);
            expect(instance.Expiration).toBe(undefined);
            expect(instance.OfferID).toBe('96F76F27D8A327FC48753167EC04A46AA0E382E6F57F32FD12274144D00F1797');
            expect(Object.keys(instance.Flags ?? {}).length).toBeGreaterThan(0);

            expect(instance.TakerPays).toStrictEqual({
                currency: 'XRP',
                value: '79550',
            });

            expect(instance.TakerGets).toStrictEqual({
                currency: 'XAG',
                issuer: 'rrrrrrrrrrrrrrrrrrrrbzbvji',
                value: '37',
            });
        });
    });

    describe('Info', () => {
        const object: any = offerObjectTemplates;
        const instance = new Offer(object);
        const info = new OfferInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `rrrrrrrrrrrrrrrrrrrrrholvtp offered to pay 37 XAG in order to receive 79550 XRP${'\n'}The exchange rate for this offer is 0.00046511627906976747 XAG/XRP${'\n'}The transaction will also cancel rrrrrrrrrrrrrrrrrrrrrholvtp 's existing offer #866${'\n'}The transaction offer ID is: 96F76F27D8A327FC48753167EC04A46AA0E382E6F57F32FD12274144D00F1797`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('global.offer'));
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
                    mutate: undefined,
                    factor: { currency: 'XRP', value: '79550', effect: 1 },
                });
            });
        });
    });

    describe('Validation', () => {});
});
