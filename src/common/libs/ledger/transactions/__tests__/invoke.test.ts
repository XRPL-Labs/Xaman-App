/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Invoke from '../invoke';

jest.mock('@services/NetworkService');

describe('Invoke tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new Invoke();
        expect(instance.TransactionType).toBe('Invoke');
        expect(instance.Type).toBe('Invoke');
    });
});
