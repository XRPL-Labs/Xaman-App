/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

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
        const { tx, meta }: any = uriTokenCreateSellOfferTemplate;
        const Mixed = MutationsMixin(URITokenCreateSellOffer);
        const instance = new Mixed(tx, meta);
        const info = new URITokenCreateSellOfferInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `rrrrrrrrrrrrrrrrrrrrrholvtp offered to sell URI token with ID 1016FBAE4CAFB51A7E768724151964FF572495934C2D4A98CCC67229749C3F72 in order to receive 10 XRP${'\n'}This offer may only be accepted by rDestinationxxxxxxxxxxxxxxxxxxxxxx`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createURITokenSellOffer'));
            });
        });
    });

    describe('Validation', () => {});
});
