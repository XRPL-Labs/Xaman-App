/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { NormalizeCurrencyCode } from '../../../../../utils/monetary';
import { MutationsMixin } from '@common/libs/ledger/mixin';

import { CheckCash, CheckCashInfo, CheckCashValidation } from '../CheckCash';
import { CheckCreate } from '../CheckCreate';

import checkCashTemplates from './fixtures/CheckCashTx.json';
import checkCreateTemplate from './fixtures/CheckCreateTx.json';

jest.mock('@services/NetworkService');

describe('CheckCash', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new CheckCash();
            expect(instance.TransactionType).toBe('CheckCash');
            expect(instance.Type).toBe('CheckCash');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = checkCashTemplates;
            const instance = new CheckCash(tx, meta);

            expect(instance.CheckID).toBe('6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B');

            expect(instance.Amount).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });
        });

        it('Should set check object', () => {
            const { tx, meta }: any = checkCashTemplates;
            const instance = new CheckCash(tx, meta);

            instance.Check = new CheckCreate(checkCreateTemplate.tx as any);

            expect(instance.Check).toBeDefined();
            expect(instance.isExpired).toBe(true);
        });

        it('Should set/get fields', () => {
            const instance = new CheckCash();

            instance.Amount = {
                currency: 'XRP',
                value: '100',
            };
            expect(instance.Amount).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });

            instance.Amount = {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '1',
            };
            expect(instance.Amount).toStrictEqual({
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '1',
            });

            instance.DeliverMin = {
                currency: 'XRP',
                value: '100',
            };
            expect(instance.DeliverMin).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });

            instance.DeliverMin = {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '1',
            };
            expect(instance.DeliverMin).toStrictEqual({
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '1',
            });
        });

        describe('Info', () => {
            const { tx, meta }: any = checkCashTemplates;
            const Mixed = MutationsMixin(CheckCash);
            const instance = new Mixed(tx, meta);
            const info = new CheckCashInfo(instance, {} as any);

            describe('generateDescription()', () => {
                it('should return the expected description', () => {
                    const expectedDescription = Localize.t('events.itWasInstructedToDeliverByCashingCheck', {
                        address: instance.Check!.Destination,
                        amount: instance.Amount!.value,
                        currency: NormalizeCurrencyCode(instance.Amount!.currency),
                        checkId: tx.CheckID,
                    });
                    expect(info.generateDescription()).toEqual(expectedDescription);
                });
            });

            describe('getEventsLabel()', () => {
                it('should return the expected label', () => {
                    expect(info.getEventsLabel()).toEqual(Localize.t('events.cashCheck'));
                });
            });

            describe('getParticipants()', () => {
                it('should return the expected participants', () => {
                    expect(info.getParticipants()).toStrictEqual({
                        start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                        end: { address: 'rrrrrrrrrrrrrrrrrrrrBZbvji', tag: undefined },
                    });
                });
            });

            describe('getMonetaryDetails()', () => {
                it('should return the expected monetary details', () => {
                    expect(info.getMonetaryDetails()).toStrictEqual({
                        mutate: {
                            sent: undefined,
                            received: {
                                currency: 'XRP',
                                value: '2.499988',
                                action: 1,
                            },
                        },
                        factor: {
                            currency: 'XRP',
                            effect: 0,
                            value: '100',
                        },
                    });
                });
            });
        });

        describe('Validation', () => {
            it('should reject if Check is not assigned', async () => {
                const { tx }: any = checkCashTemplates;
                const instance = new CheckCash(tx);

                await expect(CheckCashValidation(instance)).rejects.toThrowError(
                    Localize.t('payload.unableToGetCheckObject'),
                );
            });

            it('should reject if no valid Amount or DeliverMin is provided', async () => {
                const { tx, meta }: any = checkCashTemplates;
                const instance = new CheckCash({ ...tx }, meta);

                instance.Check = new CheckCreate(checkCreateTemplate.tx as any);

                for await (const v of [
                    {
                        currency: 'XRP',
                        value: '0',
                    },
                    undefined,
                    {
                        currency: 'USD',
                        issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                        value: '0',
                    },
                ]) {
                    instance.Amount = v;
                    instance.DeliverMin = v;

                    await expect(CheckCashValidation(instance)).rejects.toThrowError(
                        Localize.t('send.pleaseEnterAmount'),
                    );
                }
            });

            it('should reject if Amount exceeds Check SendMax', async () => {
                const { tx, meta }: any = checkCashTemplates;
                const instance = new CheckCash({ ...tx, ...{ Amount: checkCreateTemplate.tx.SendMax + 1 } }, meta);

                instance.Check = new CheckCreate(checkCreateTemplate.tx as any);

                await expect(CheckCashValidation(instance)).rejects.toThrowError(
                    Localize.t('payload.insufficientCashAmount', {
                        amount: instance.Check!.SendMax!.value,
                        currency: NormalizeCurrencyCode(instance.Check!.SendMax!.currency),
                    }),
                );
            });

            it('should reject if DeliverMin exceeds Check SendMax', async () => {
                const { tx, meta }: any = checkCashTemplates;
                const instance = new CheckCash({ ...tx, ...{ DeliverMin: checkCreateTemplate.tx.SendMax + 1 } }, meta);

                instance.Check = new CheckCreate(checkCreateTemplate.tx as any);

                await expect(CheckCashValidation(instance)).rejects.toThrowError(
                    Localize.t('payload.insufficientCashAmount', {
                        amount: instance.Check!.SendMax!.value,
                        currency: NormalizeCurrencyCode(instance.Check!.SendMax!.currency),
                    }),
                );
            });

            it('should reject if Account address is not equal to Check Destination address', async () => {
                const { tx, meta }: any = checkCashTemplates;
                const instance = new CheckCash({ ...tx, ...{ Account: 'rAccountxxxxxxxxxxxxxxxxxxxxxxxxxx' } }, meta);

                instance.Check = new CheckCreate(checkCreateTemplate.tx as any);

                await expect(CheckCashValidation(instance)).rejects.toThrowError(
                    Localize.t('payload.checkCanOnlyCashByCheckDestination'),
                );
            });

            it('should resolve if all validations pass', async () => {
                const { tx, meta }: any = checkCashTemplates;
                const instance = new CheckCash(
                    {
                        ...tx,
                        ...{ Account: checkCreateTemplate.tx.Destination, Amount: checkCreateTemplate.tx.SendMax },
                    },
                    meta,
                );

                instance.Check = new CheckCreate(checkCreateTemplate.tx as any);

                await expect(CheckCashValidation(instance)).resolves.toBeUndefined();
            });
        });
    });
});
