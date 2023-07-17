/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import URITokenMint from '../uriTokenMint';

jest.mock('@services/NetworkService');

describe('URITokenMint tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new URITokenMint();
        expect(instance.TransactionType).toBe('URITokenMint');
        expect(instance.Type).toBe('URITokenMint');
    });
});
