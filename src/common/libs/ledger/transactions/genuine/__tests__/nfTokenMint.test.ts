/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { NFTokenMint } from '../NFTokenMint';

jest.mock('@services/NetworkService');

describe('NFTokenMint tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new NFTokenMint();
        expect(instance.TransactionType).toBe('NFTokenMint');
        expect(instance.Type).toBe('NFTokenMint');
    });
});
