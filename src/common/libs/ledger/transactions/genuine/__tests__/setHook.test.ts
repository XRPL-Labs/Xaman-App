/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { SetHook } from '../SetHook';

jest.mock('@services/NetworkService');

describe('SetHook tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new SetHook();
        expect(instance.TransactionType).toBe('SetHook');
        expect(instance.Type).toBe('SetHook');
    });
});
