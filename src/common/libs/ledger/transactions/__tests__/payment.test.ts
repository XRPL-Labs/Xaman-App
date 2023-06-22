/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import LedgerService from '@services/LedgerService';

import Payment from '../payment';

import txTemplates from './templates/PaymentTx.json';

jest.mock('@services/NetworkService');

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

    it('Should be able to validate the transaction', async () => {
        const Account = 'rEAa7TDpBdL1hoRRAp3WDmzBcuQzaXssmb';
        const Destination = 'r39CmfchUiq3y2xJ23nJpnDHVitPbiHbAz';

        // should reject if no amount is added to the transaction
        const paymentsWithEmptyAmount = [
            {},
            { Amount: '0' },
            { Amount: { currency: 'USD' } },
            { Amount: { currency: 'USD', value: '0' } },
        ];
        for (const payment of paymentsWithEmptyAmount) {
            await expect(new Payment(payment).validate()).rejects.toThrow(
                new Error('[missing "en.send.pleaseEnterAmount" translation]'),
            );
        }

        // should reject if sending XRP and insufficient balance
        const spyAvailableBalance = jest
            .spyOn(LedgerService, 'getAccountAvailableBalance')
            .mockImplementation(() => Promise.resolve(10));

        const spyGetFilteredAccountLine = jest.spyOn(LedgerService, 'getFilteredAccountLine').mockImplementation(() =>
            Promise.resolve({
                limit: '10000',
                balance: '10',
                account: 'r...',
                currency: 'USD',
                limit_peer: '0',
                quality_in: 0,
                quality_out: 0,
            }),
        );

        const paymentsWithXRPPayments = [
            { Account, Destination, Amount: '20000000' },
            { Account, Destination, Amount: { currency: 'USD', value: '1' }, SendMax: '20000000' },
        ];

        for (const payment of paymentsWithXRPPayments) {
            await expect(new Payment(payment).validate()).rejects.toThrow(
                new Error('[missing "en.send.insufficientBalanceSpendableBalance" translation]'),
            );
        }

        spyGetFilteredAccountLine.mockRestore();
        spyAvailableBalance.mockRestore();

        // should reject if sending IOU and insufficient balance
        const spy2 = jest.spyOn(LedgerService, 'getFilteredAccountLine').mockImplementation(() =>
            Promise.resolve({
                limit: '10000',
                balance: '10',
                account: 'r...',
                currency: 'USD',
                limit_peer: '0',
                quality_in: 0,
                quality_out: 0,
            }),
        );

        const paymentsWithIOUPayments = [
            { Account, Destination, Amount: { currency: 'USD', value: '20' } },
            { Account, Destination, SendMax: { currency: 'USD', value: '20' }, Amount: '20000000' },
        ];

        for (const payment of paymentsWithIOUPayments) {
            await expect(new Payment(payment).validate()).rejects.toThrow(
                new Error('[missing "en.send.insufficientBalanceSpendableBalance" translation]'),
            );
        }
        spy2.mockRestore();

        // should reject if sending IOU and destination doesn't have proper TrustLine
        const destinationLineConditions = [
            undefined,
            {
                limit: '0',
                balance: '0',
                account: 'r...',
                currency: 'USD',
                limit_peer: '0',
                quality_in: 0,
                quality_out: 0,
            },
        ];

        for (const condition of destinationLineConditions) {
            const spy3 = jest
                .spyOn(LedgerService, 'getFilteredAccountLine')
                .mockImplementation(() => Promise.resolve(condition));
            await expect(
                new Payment({
                    Account,
                    Destination,
                    Amount: { currency: 'USD', value: '20', issuer: 'r...' },
                }).validate(),
            ).rejects.toThrow(
                new Error('[missing "en.send.unableToSendPaymentRecipientDoesNotHaveTrustLine" translation]'),
            );
            spy3.mockRestore();
        }
    });
});
