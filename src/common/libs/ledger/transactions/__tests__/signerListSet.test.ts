/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import SignerListSet from '../signerListSet';

import signerListSetTemplates from './templates/SignerListSetTx.json';

describe('SignerListSet tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new SignerListSet();
        expect(instance.TransactionType).toBe('SignerListSet');
        expect(instance.Type).toBe('SignerListSet');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = signerListSetTemplates;
        const instance = new SignerListSet(tx, meta);

        expect(instance.SignerQuorum).toBe(3);

        expect(instance.SignerEntries).toStrictEqual([
            { account: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW', weight: 2 },
            { account: 'rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v', weight: 1 },
            { account: 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n', weight: 1 },
        ]);
    });
});
