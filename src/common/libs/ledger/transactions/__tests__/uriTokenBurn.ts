/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import URITokenBurn from '../uriTokenBurn';

jest.mock('@services/NetworkService');

describe('URITokenBurn tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new URITokenBurn();
        expect(instance.TransactionType).toBe('URITokenBurn');
        expect(instance.Type).toBe('URITokenBurn');
    });
});
