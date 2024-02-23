/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import LedgerService from '@services/LedgerService';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { Payment, PaymentInfo, PaymentValidation } from '../Payment';
import paymentTemplate from './fixtures/PaymentTx.json';

import { OperationActions } from '../../../parser/types';

jest.mock('@services/NetworkService');

describe('Payment tx', () => {
    const Mixed = MutationsMixin(Payment);

    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new Payment();
            expect(instance.TransactionType).toBe('Payment');
            expect(instance.Type).toBe('Payment');
        });

        it('Should return right parsed values for tx XRP->XRP', () => {
            const { tx, meta }: any = paymentTemplate.XRP2XRP;
            const instance = new Payment(tx, meta);

            expect(instance.InvoiceID).toBe('123');

            expect(instance.Amount).toStrictEqual({
                currency: 'XRP',
                value: '85.5321',
            });

            expect(instance.Destination).toEqual('rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh');
            expect(instance.DestinationTag).toEqual(123);
        });

        it('Should return right parsed values for tx to self with path sets', () => {
            const { tx, meta }: any = paymentTemplate.ToSelfWithPath;
            const instance = new Mixed(tx, meta);

            expect(instance.BalanceChange(tx.Account)).toStrictEqual({
                received: {
                    action: OperationActions.INC,
                    currency: 'XRP',
                    issuer: undefined,
                    value: '0.999988',
                },
                sent: {
                    action: OperationActions.DEC,
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
            instance.Amount = {
                currency: 'XRP',
                value: '85.5321',
            };
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

            instance.Destination = 'rXUMMProAS9qHvxooeJMYz5smAsJZvArh';
            instance.DestinationTag = 1337;

            expect(instance.Destination).toEqual('rXUMMProAS9qHvxooeJMYz5smAsJZvArh');
            expect(instance.DestinationTag).toEqual(1337);

            instance.SendMax = {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrrholvtp',
                value: '1',
            };
            expect(instance.SendMax).toStrictEqual({
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrrholvtp',
                value: '1',
            });

            instance.SendMax = {
                currency: 'XRP',
                value: '85.5321',
            };
            expect(instance.SendMax).toStrictEqual({
                currency: 'XRP',
                value: '85.5321',
            });

            instance.DeliverMin = {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrrholvtp',
                value: '1',
            };
            expect(instance.DeliverMin).toStrictEqual({
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrrholvtp',
                value: '1',
            });
            instance.DeliverMin = {
                currency: 'XRP',
                value: '85.5321',
            };
            expect(instance.DeliverMin).toStrictEqual({
                currency: 'XRP',
                value: '85.5321',
            });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = paymentTemplate.ToSelfWithPath;
        const instance = new Mixed(tx, meta);
        const info = new PaymentInfo(instance, { address: tx.Account } as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The payment source tag is: 1337 ${'\n'}The payment destination tag is: 1338 ${'\n'}It was instructed to deliver 1 XRP ${'\n'}by spending up to 1.239054364262807 USD`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });
        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.paymentReceived'));
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
            ] as any;
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
            ] as any;

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
            ] as any;

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
                        } as any),
                    ),
                ).rejects.toThrow(new Error(Localize.t('send.unableToSendPaymentRecipientDoesNotHaveTrustLine')));
                spy3.mockRestore();
            }
        });
    });
});
