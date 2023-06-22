/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import AccountSet from '../accountSet';

import txTemplates from './templates/AccountSetTx.json';

jest.mock('@services/NetworkService');

describe('AccountSet tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new AccountSet();
        expect(instance.TransactionType).toBe('AccountSet');
        expect(instance.Type).toBe('AccountSet');
    });

    it('Should return right parsed values', () => {
        const { tx } = txTemplates;
        const instance = new AccountSet(tx);

        expect(instance.Domain).toBe('example.com');
        expect(instance.MessageKey).toBe('03AB40A0490F9B7ED8DF29D246BF2D6269820A0EE7742ACDD457BEA7C7D0931EDB');
        expect(instance.SetFlag).toBe('asfAccountTxnID');
        expect(instance.ClearFlag).toBe('asfDisableMaster');
        expect(instance.EmailHash).toBe('0bc83cb571cd1c50ba6f3e8a78ef1346');
        expect(instance.TransferRate).toBe(0.2);
        expect(instance.TickSize).toBe(0);
    });
});
