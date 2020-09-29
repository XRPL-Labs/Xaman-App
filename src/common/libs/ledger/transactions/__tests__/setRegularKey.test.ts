/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import SetRegularKey from '../setRegularKey';

import txTemplates from './templates/SetRegularKeyTx.json';

describe('SetRegularKey tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new SetRegularKey();
        expect(instance.Type).toBe('SetRegularKey');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const instance = new SetRegularKey(txTemplates);

        expect(instance.RegularKey).toBe('rAR8rR8sUkBoCZFawhkWzY4Y5YoyuznwD');
    });
});
