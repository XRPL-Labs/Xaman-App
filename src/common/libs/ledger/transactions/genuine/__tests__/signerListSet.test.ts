/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { SignerListSet } from '../SignerListSet';
import signerListSetTemplates from './fixtures/SignerListSetTx.json';

jest.mock('@services/NetworkService');

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
            {
                account: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
                walletLocator: '03075F65D8353E3A5DA3193FF976BC17A2D0B9376BE7DA942349B6526E5A2BBF54',
                weight: 2,
            },
            { account: 'rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v', walletLocator: undefined, weight: 1 },
            { account: 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n', walletLocator: undefined, weight: 1 },
        ]);
    });
});
