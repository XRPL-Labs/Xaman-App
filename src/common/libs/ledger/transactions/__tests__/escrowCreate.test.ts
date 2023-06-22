/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import EscrowCreate from '../escrowCreate';

import escrowCreateTemplate from './templates/EscrowCreateTx.json';

jest.mock('@services/NetworkService');

describe('EscrowCreate tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new EscrowCreate();
        expect(instance.TransactionType).toBe('EscrowCreate');
        expect(instance.Type).toBe('EscrowCreate');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = escrowCreateTemplate;
        const instance = new EscrowCreate(tx, meta);

        expect(instance.Destination).toStrictEqual({
            tag: 23480,
            address: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
        });
        expect(instance.Amount).toStrictEqual({
            currency: 'XRP',
            value: '0.01',
        });

        expect(instance.Condition).toBe(
            'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
        );

        expect(instance.CancelAfter).toBe('2016-11-23T23:12:38.000Z');
        expect(instance.FinishAfter).toBe('2016-11-22T23:12:38.000Z');
    });
});
