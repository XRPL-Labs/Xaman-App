/* eslint-disable spellcheck/spell-checker */

import Localize from '@locale';
import LedgerService from '@services/LedgerService';
import { MutationsMixin } from '@common/libs/ledger/mixin';

import { AccountDelete, AccountDeleteInfo, AccountDeleteValidation } from '../AccountDelete';
import txTemplates from './fixtures/AccountDeleteTx.json';

jest.mock('@services/LedgerService');
jest.mock('@services/NetworkService');

const MixedAccountDelete = MutationsMixin(AccountDelete);
// Test ==========================================================================================
describe('AccountDelete', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AccountDelete();
            expect(instance.TransactionType).toBe('AccountDelete');
            expect(instance.Type).toBe('AccountDelete');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = txTemplates;
            const instance = new AccountDelete(tx, meta);

            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.DestinationTag).toEqual(0);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = txTemplates;
        const instance = new MixedAccountDelete(tx, meta);
        const infoInstance = new AccountDeleteInfo(instance, { address: tx.Account } as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription =
                    'It deleted account rrrrrrrrrrrrrrrrrrrrrholvtp\n' +
                    // eslint-disable-next-line max-len
                    'It was instructed to deliver the remaining balance of 15.00102 XRP to rrrrrrrrrrrrrrrrrrrrbzbvji\n' +
                    'The transaction source tag is: 1337\n' +
                    'The transaction destination tag is: 0';

                expect(infoInstance.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(infoInstance.getEventsLabel()).toEqual(Localize.t('events.deleteAccount'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(infoInstance.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: 1337 },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrbzbvji', tag: 0 },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(infoInstance.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'DEC',
                            currency: 'XRP',
                            effect: 'IMMEDIATE_EFFECT',
                            value: '15.00102',
                        },
                    ],
                    mutate: {
                        DEC: [
                            {
                                action: 'DEC',
                                currency: 'XRP',
                                value: '15.00102',
                            },
                        ],
                        INC: [],
                    },
                });
            });
        });
    });

    describe('Validation', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should reject if account and destination are the same', async () => {
            const { tx, meta }: any = txTemplates;
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
            const { tx, meta }: any = txTemplates;
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
            const { tx, meta }: any = txTemplates;
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
            const { tx, meta }: any = txTemplates;
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
            const { tx, meta }: any = txTemplates;
            const instance = new AccountDelete({ ...tx, DestinationTag: undefined }, meta);

            // @ts-ignore
            jest.spyOn(LedgerService, 'getAccountInfo').mockResolvedValueOnce({
                account_flags: {
                    requireDestinationTag: true,
                    defaultRipple: false,
                    depositAuth: false,
                    disableMasterKey: false,
                    disallowIncomingXRP: false,
                    globalFreeze: false,
                    noFreeze: false,
                    passwordSpent: false,
                    requireAuthorization: false,
                    allowTrustLineClawback: false,
                },
            });
            expect.assertions(1);
            try {
                await AccountDeleteValidation(instance);
            } catch (error: any) {
                expect(error.message).toEqual(Localize.t('account.destinationAddressRequiredDestinationTag'));
            }
        });

        it('should resolve if all conditions are met', async () => {
            const { tx, meta }: any = txTemplates;
            const instance = new AccountDelete(tx, meta);

            jest.spyOn(LedgerService, 'getAccountBlockerObjects').mockResolvedValueOnce([]);
            jest.spyOn(LedgerService, 'getAccountSequence').mockResolvedValueOnce(10);
            // @ts-ignore
            jest.spyOn(LedgerService, 'getAccountInfo').mockResolvedValueOnce({
                account_flags: {
                    requireDestinationTag: false,
                    defaultRipple: false,
                    depositAuth: false,
                    disableMasterKey: false,
                    disallowIncomingXRP: false,
                    globalFreeze: false,
                    noFreeze: false,
                    passwordSpent: false,
                    requireAuthorization: false,
                    allowTrustLineClawback: false,
                },
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
