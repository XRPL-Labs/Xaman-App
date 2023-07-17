/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import URITokenBuy from '../uriTokenBuy';

jest.mock('@services/NetworkService');

describe('URITokenBuy tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new URITokenBuy();
        expect(instance.TransactionType).toBe('URITokenBuy');
        expect(instance.Type).toBe('URITokenBuy');
    });
});
