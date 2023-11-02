/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { NFTokenBurn } from '../NFTokenBurn';

jest.mock('@services/NetworkService');

describe('NFTokenBurn tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new NFTokenBurn();
        expect(instance.TransactionType).toBe('NFTokenBurn');
        expect(instance.Type).toBe('NFTokenBurn');
    });
});
