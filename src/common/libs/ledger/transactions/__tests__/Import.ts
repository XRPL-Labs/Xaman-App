/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Import from '../import';

jest.mock('@services/NetworkService');

describe('Import tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new Import();
        expect(instance.TransactionType).toBe('Import');
        expect(instance.Type).toBe('Import');
    });
});
