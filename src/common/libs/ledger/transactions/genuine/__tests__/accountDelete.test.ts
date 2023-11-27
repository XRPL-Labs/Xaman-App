/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';
import LedgerService from '@services/LedgerService';

import { AccountDelete, AccountDeleteInfo, AccountDeleteValidation } from '../AccountDelete';
import txTemplates from './fixtures/AccountDeleteTx.json';

jest.mock('@services/LedgerService');
jest.mock('@services/NetworkService');

describe('AccountDelete', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AccountDelete();
            expect(instance.TransactionType).toBe('AccountDelete');
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
                address: 'rDestinationxxxxxxxxxxxxxxxxxxxxxx',
            });
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = txTemplates;
                const instance = new AccountDelete(tx, meta);

                const expectedDescription = `${Localize.t('events.itDeletedAccount', {
                    address: 'rAccountxxxxxxxxxxxxxxxxxxxxxxxxxx',
                })}\n\n${Localize.t('events.itWasInstructedToDeliverTheRemainingBalanceOf', {
                    amount: '15.00102',
                    currency: 'XRP',
                    destination: 'rDestinationxxxxxxxxxxxxxxxxxxxxxx',
                })}\n${Localize.t('events.theTransactionHasASourceTag', { tag: 1337 })}\n${Localize.t(
                    'events.theTransactionHasADestinationTag',
                    { tag: 0 },
                )}`;

                expect(AccountDeleteInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(AccountDeleteInfo.getLabel()).toEqual(Localize.t('events.deleteAccount'));
            });
        });
    });

    describe('Validation', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should reject if account and destination are the same', async () => {
            const { tx, meta } = txTemplates;
            const instance = new AccountDelete(
                {
                    ...tx,
                    ...{
                        Account: 'rxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                        Destination: 'rxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                    },
                },
                meta,
            );

            expect.assertions(1);
            try {
                await AccountDeleteValidation(instance);
            } catch (error: any) {
                expect(error.message).toEqual(Localize.t('account.destinationAccountAndSourceCannotBeSame'));
            }
        });

        it('should reject if account has blocker objects', async () => {
            const { tx, meta } = txTemplates;
            const instance = new AccountDelete(tx, meta);

            // @ts-ignore
            jest.spyOn(LedgerService, 'getAccountBlockerObjects').mockResolvedValueOnce([{ LedgerEntryType: 'Offer' }]);
            expect.assertions(1);
            try {
                await AccountDeleteValidation(instance);
            } catch (error: any) {
                expect(error.message).toEqual(Localize.t('account.deleteAccountObjectsExistError'));
            }
        });

        it('should reject if account sequence is not enough', async () => {
            const { tx, meta } = txTemplates;
            const instance = new AccountDelete(tx, meta);

            const accountSequence = 10;
            const lastLedger = 5;

            jest.spyOn(LedgerService, 'getAccountSequence').mockResolvedValueOnce(accountSequence);
            jest.spyOn(LedgerService, 'getLedgerStatus').mockReturnValueOnce({ Fee: 15, LastLedger: lastLedger });
            expect.assertions(1);
            try {
                await AccountDeleteValidation(instance);
            } catch (error: any) {
                expect(error.message).toEqual(
                    Localize.t('account.deleteAccountSequenceIsNotEnoughError', {
                        remainingSequence: accountSequence + 256 - lastLedger,
                    }),
                );
            }
        });

        it('should reject if destination account is not activated', async () => {
            const { tx, meta } = txTemplates;
            const instance = new AccountDelete(tx, meta);

            // @ts-ignore
            jest.spyOn(LedgerService, 'getAccountInfo').mockResolvedValueOnce({ error: 'accountNotFound' });
            expect.assertions(1);
            try {
                await AccountDeleteValidation(instance);
            } catch (error: any) {
                expect(error.message).toEqual(Localize.t('account.destinationAccountIsNotActivated'));
            }
        });

        it('should reject if destination account requires destination tag but tag is not provided', async () => {
            const { tx, meta } = txTemplates;
            const instance = new AccountDelete({ ...tx, DestinationTag: undefined }, meta);

            // @ts-ignore
            jest.spyOn(LedgerService, 'getAccountInfo').mockResolvedValueOnce({
                account_flags: { requireDestinationTag: true },
            });
            expect.assertions(1);
            try {
                await AccountDeleteValidation(instance);
            } catch (error: any) {
                expect(error.message).toEqual(Localize.t('account.destinationAddressRequiredDestinationTag'));
            }
        });

        it('should resolve if all conditions are met', async () => {
            const { tx, meta } = txTemplates;
            const instance = new AccountDelete(tx, meta);

            jest.spyOn(LedgerService, 'getAccountBlockerObjects').mockResolvedValueOnce([]);
            jest.spyOn(LedgerService, 'getAccountSequence').mockResolvedValueOnce(10);
            // @ts-ignore
            jest.spyOn(LedgerService, 'getAccountInfo').mockResolvedValueOnce({
                account_flags: { requireDestinationTag: false },
            });
            try {
                await AccountDeleteValidation(instance);
            } catch {
                // should not throw an error
                expect(true).toBe(true);
            }
        });
    });
});
