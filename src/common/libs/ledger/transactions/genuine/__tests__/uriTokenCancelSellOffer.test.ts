/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { URITokenCancelSellOffer, URITokenCancelSellOfferInfo } from '../URITokenCancelSellOffer';

import uriTokenCancelSellOfferTemplate from './fixtures/URITokenCancelSellOfferTx.json';

jest.mock('@services/NetworkService');

describe('URITokenCancelSellOffer tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new URITokenCancelSellOffer();
            expect(instance.TransactionType).toBe('URITokenCancelSellOffer');
            expect(instance.Type).toBe('URITokenCancelSellOffer');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = uriTokenCancelSellOfferTemplate;
        const Mixed = MutationsMixin(URITokenCancelSellOffer);
        const instance = new Mixed(tx, meta);
        const info = new URITokenCancelSellOfferInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                // eslint-disable-next-line quotes
                const expectedDescription = `The transaction will cancel rrrrrrrrrrrrrrrrrrrrrholvtp${"'"}s sell offer for URI token with ID 9CE208D4743A11AB5BAE47E23E917D456EB722A89568EDCCCA94B3B04ADC95D2`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.cancelURITokenSellOffer'));
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
