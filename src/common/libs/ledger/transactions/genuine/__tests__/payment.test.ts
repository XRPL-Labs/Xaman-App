/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import LedgerService from '@services/LedgerService';

import { Payment, PaymentInfo, PaymentValidation } from '../Payment';
import paymentTemplate from './fixtures/PaymentTx.json';

import { NormalizeCurrencyCode } from '../../../../../utils/amount';

jest.mock('@services/NetworkService');

describe('Payment tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new Payment();
            expect(instance.TransactionType).toBe('Payment');
            expect(instance.Type).toBe('Payment');
        });

        it('Should return right parsed values for tx XRP->XRP', () => {
            const { tx, meta } = paymentTemplate.XRP2XRP;
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
            const { tx, meta } = paymentTemplate.ToSelfWithPath;
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

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = paymentTemplate.ToSelfWithPath;
                const instance = new Payment(tx, meta);

                const expectedDescription = `${Localize.t('events.thePaymentHasASourceTag', {
                    tag: instance.Account.tag,
                })} \n${Localize.t('events.thePaymentHasADestinationTag', {
                    tag: instance.Destination.tag,
                })} \n${Localize.t('events.itWasInstructedToDeliver', {
                    amount: instance.Amount.value,
                    currency: NormalizeCurrencyCode(instance.Amount.currency),
                })} ${Localize.t('events.bySpendingUpTo', {
                    amount: instance.SendMax.value,
                    currency: NormalizeCurrencyCode(instance.SendMax.currency),
                })}`;

                expect(PaymentInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                const { tx, meta } = paymentTemplate.SimplePayment;
                const instance = new Payment(tx, meta);
                // @ts-ignore
                expect(PaymentInfo.getLabel(instance, { address: tx.Account })).toEqual(
                    Localize.t('events.paymentSent'),
                );
            });
        });
    });

    describe('Validation', () => {
        it('should be able to validate the payment', async () => {
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
                await expect(PaymentValidation(new Payment(payment))).rejects.toThrow(
                    new Error(Localize.t('send.pleaseEnterAmount')),
                );
            }

            // should reject if sending XRP and insufficient balance
            const spyAvailableBalance = jest
                .spyOn(LedgerService, 'getAccountAvailableBalance')
                .mockImplementation(() => Promise.resolve(10));

            const spyGetFilteredAccountLine = jest
                .spyOn(LedgerService, 'getFilteredAccountLine')
                .mockImplementation(() =>
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
                await expect(PaymentValidation(new Payment(payment))).rejects.toThrow(
                    new Error(
                        Localize.t('send.insufficientBalanceSpendableBalance', {
                            spendable: '10',
                            currency: 'XRP',
                        }),
                    ),
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
                await expect(PaymentValidation(new Payment(payment))).rejects.toThrow(
                    new Error(
                        Localize.t('send.insufficientBalanceSpendableBalance', {
                            spendable: '10',
                            currency: 'USD',
                        }),
                    ),
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
                    PaymentValidation(
                        new Payment({
                            Account,
                            Destination,
                            Amount: { currency: 'USD', value: '20', issuer: 'r...' },
                        }),
                    ),
                ).rejects.toThrow(new Error(Localize.t('send.unableToSendPaymentRecipientDoesNotHaveTrustLine')));
                spy3.mockRestore();
            }
        });
    });
});
