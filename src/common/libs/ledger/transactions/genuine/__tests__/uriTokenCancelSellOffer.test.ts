/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { URITokenCancelSellOffer, URITokenCancelSellOfferInfo } from '../URITokenCancelSellOffer';

import uriTokenCancelSellOfferTemplate from './fixtures/NFTokenCancelOfferTx.json';

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
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = uriTokenCancelSellOfferTemplate;
                const instance = new URITokenCancelSellOffer(tx, meta);

                const expectedDescription = `This is an ${instance.Type} transaction`;

                expect(URITokenCancelSellOfferInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(URITokenCancelSellOfferInfo.getLabel()).toEqual(Localize.t('events.cancelURITokenSellOffer'));
            });
        });
    });

    describe('Validation', () => {});
});
