/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { URITokenCancelSellOffer } from '../URITokenCancelSellOffer';

jest.mock('@services/NetworkService');

describe('URITokenCancelSellOffer tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new URITokenCancelSellOffer();
        expect(instance.TransactionType).toBe('URITokenCancelSellOffer');
        expect(instance.Type).toBe('URITokenCancelSellOffer');
    });
});
