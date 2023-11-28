/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { URITokenCreateSellOffer, URITokenCreateSellOfferInfo } from '../URITokenCreateSellOffer';

import uriTokenCreateSellOfferTemplate from './fixtures/URITokenCreateSellOfferTx.json';

jest.mock('@services/NetworkService');

describe('URITokenCreateSellOffer tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new URITokenCreateSellOffer();
            expect(instance.TransactionType).toBe('URITokenCreateSellOffer');
            expect(instance.Type).toBe('URITokenCreateSellOffer');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = uriTokenCreateSellOfferTemplate;
                const instance = new URITokenCreateSellOffer(tx, meta);

                const expectedDescription = `This is an ${instance.Type} transaction`;

                expect(URITokenCreateSellOfferInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(URITokenCreateSellOfferInfo.getLabel()).toEqual(Localize.t('events.createURITokenSellOffer'));
            });
        });
    });

    describe('Validation', () => {});
});
