/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import BaseLedgerObject from '../base';

jest.mock('@services/LedgerService');
jest.mock('@services/NetworkService');

// TODO: ADD MORE TEST CASES
describe.skip('Base object', () => {
    describe('Class', () => {
        it('Should not be able to set any value to fields', () => {
            const instance = new BaseLedgerObject({} as any);

            try {
                instance.Flags = {};
            } catch (e: any) {
                expect(e.message).toBe('Flags is readonly!');
            }
        });
    });
});
