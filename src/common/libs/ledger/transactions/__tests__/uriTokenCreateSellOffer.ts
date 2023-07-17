/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import URITokenCreateSellOffer from '../uriTokenCreateSellOffer';

jest.mock('@services/NetworkService');

describe('URITokenCreateSellOffer tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new URITokenCreateSellOffer();
        expect(instance.TransactionType).toBe('URITokenCreateSellOffer');
        expect(instance.Type).toBe('URITokenCreateSellOffer');
    });
});
