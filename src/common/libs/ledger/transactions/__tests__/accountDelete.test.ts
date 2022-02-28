/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import AccountDelete from '../accountDelete';

import txTemplates from './templates/AccountDeleteTx.json';

jest.mock('@services/LedgerService');

describe('AccountDelete tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new AccountDelete();
        expect(instance.Type).toBe('AccountDelete');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = txTemplates;
        const instance = new AccountDelete(tx, meta);

        expect(instance.Amount).toStrictEqual({
            currency: 'XRP',
            value: '15.00102',
        });

        expect(instance.Destination).toStrictEqual({
            tag: 0,
            address: 'r49LZgcrnFU7YRAjMwxWSoxAcsRom5ZGym',
            name: undefined,
        });
    });

    it('it should calcualte right fee', () => {
        const { tx, meta } = txTemplates;
        const instance = new AccountDelete(tx, meta);

        expect(instance.calculateFee()).toBe('2000000');
    });
});
