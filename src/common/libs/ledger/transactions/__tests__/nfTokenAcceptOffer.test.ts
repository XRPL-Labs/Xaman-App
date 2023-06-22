/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import NFTokenAcceptOffer from '../nfTokenAcceptOffer';

jest.mock('@services/NetworkService');

describe('NFTokenAcceptOffer tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new NFTokenAcceptOffer();
        expect(instance.TransactionType).toBe('NFTokenAcceptOffer');
        expect(instance.Type).toBe('NFTokenAcceptOffer');
    });
});
