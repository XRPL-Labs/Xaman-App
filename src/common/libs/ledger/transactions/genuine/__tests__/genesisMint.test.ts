/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import { GenesisMint } from '../GenesisMint';

jest.mock('@services/NetworkService');

describe('GenesisMint tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new GenesisMint();
        expect(instance.Type).toBe('GenesisMint');
    });
});
