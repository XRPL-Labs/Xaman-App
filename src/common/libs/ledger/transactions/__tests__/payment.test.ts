/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Payment from '../payment';

import txTemplates from './templates/PaymentTx.json';

describe('Payment tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new Payment();
        expect(instance.TransactionType).toBe('Payment');
        expect(instance.Type).toBe('Payment');
    });

    it('Should return right parsed values for tx XRP->XRP', () => {
        const { tx, meta } = txTemplates.XRP2XRP;
        const instance = new Payment(tx, meta);

        expect(instance.InvoiceID).toBe('123');

        expect(instance.Amount).toStrictEqual({
            currency: 'XRP',
            value: '85.5321',
        });

        expect(instance.Destination).toStrictEqual({
            tag: 123,
            address: 'rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh',
        });
    });

    it('Should return right parsed values for tx to self with path sets', () => {
        const { tx, meta } = txTemplates.ToSelfWithPath;
        const instance = new Payment(tx, meta);

        expect(instance.BalanceChange()).toStrictEqual({
            received: {
                action: 'INC',
                currency: 'XRP',
                value: '0.999988',
            },
            sent: {
                action: 'DEC',
                currency: 'USD',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '1.23905437',
            },
        });
    });

    it('Should set/get payment fields', () => {
        const instance = new Payment();

        instance.InvoiceID = '123';
        expect(instance.InvoiceID).toBe('123');

        // amount
        // @ts-ignore
        instance.Amount = '85.5321';
        expect(instance.Amount).toStrictEqual({
            currency: 'XRP',
            value: '85.5321',
        });

        instance.Amount = {
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        };
        expect(instance.Amount).toStrictEqual({
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        });

        instance.Destination = {
            address: 'rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh',
            tag: 1234,
        };
        expect(instance.Destination).toStrictEqual({
            tag: 1234,
            address: 'rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh',
        });

        instance.SendMax = {
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        };
        expect(instance.SendMax).toStrictEqual({
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        });
        // @ts-ignore
        instance.SendMax = '85.5321';
        expect(instance.SendMax).toStrictEqual({
            currency: 'XRP',
            value: '85.5321',
        });

        instance.DeliverMin = {
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        };
        expect(instance.DeliverMin).toStrictEqual({
            currency: 'USD',
            issuer: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            value: '1',
        });
        // @ts-ignore
        instance.DeliverMin = '85.5321';
        expect(instance.DeliverMin).toStrictEqual({
            currency: 'XRP',
            value: '85.5321',
        });
    });
});
