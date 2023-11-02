/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import LedgerService from '@services/LedgerService';

import { NormalizeCurrencyCode } from '../../../../../utils/amount';

import { CheckCreate, CheckCreateInfo, CheckCreateValidation } from '../CheckCreate';

import checkCreateTemplate from './fixtures/CheckCreateTx.json';

jest.mock('@services/LedgerService');
jest.mock('@services/NetworkService');

describe('CheckCreate', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new CheckCreate();
            expect(instance.TransactionType).toBe('CheckCreate');
            expect(instance.Type).toBe('CheckCreate');
        });

        it('Should return right parsed values', () => {
            const { tx, meta } = checkCreateTemplate;
            const instance = new CheckCreate(tx, meta);

            expect(instance.SendMax).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });

            expect(instance.Expiration).toBe('2018-01-24T12:52:01.000Z');

            expect(instance.Destination).toStrictEqual({
                tag: 1,
                address: 'rrrrrrrrrrrrrrrrrrrn5RM1rHd',
            });

            expect(instance.InvoiceID).toBe('6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B');
        });

        it('Should set/get fields', () => {
            const instance = new CheckCreate();

            // @ts-ignore
            instance.SendMax = '100';
            expect(instance.SendMax).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });

            instance.Destination = {
                address: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                tag: 1337,
            };
            expect(instance.Destination).toStrictEqual({
                address: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                tag: 1337,
            });

            // @ts-ignore
            instance.SendMax = {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '1',
            };
            expect(instance.SendMax).toStrictEqual({
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                value: '1',
            });
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = checkCreateTemplate;
                const instance = new CheckCreate(tx, meta);

                const expectedDescription = `${Localize.t('events.theCheckIsFromTo', {
                    address: instance.Account.address,
                    destination: instance.Destination.address,
                })}\n${Localize.t('events.theCheckHasASourceTag', { tag: instance.Account.tag })}\n${Localize.t(
                    'events.theCheckHasADestinationTag',
                    { tag: instance.Destination.tag },
                )}\n\n${Localize.t('events.maximumAmountCheckIsAllowToDebit', {
                    value: instance.SendMax.value,
                    currency: NormalizeCurrencyCode(instance.SendMax.currency),
                })}`;

                expect(CheckCreateInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(CheckCreateInfo.getLabel()).toEqual(Localize.t('events.createCheck'));
            });
        });
    });

    describe('Validation', () => {
        it('should reject if SendMax is not set or zero', async () => {
            const { tx, meta } = checkCreateTemplate;
            const instance = new CheckCreate({ ...tx, ...{ SendMax: undefined } }, meta);

            for await (const v of [
                '0',
                undefined,
                {
                    currency: 'USD',
                    issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                    value: '0',
                },
            ]) {
                // @ts-ignore
                instance.SendMax = v;

                await expect(CheckCreateValidation(instance)).rejects.toThrowError(
                    Localize.t('send.pleaseEnterAmount'),
                );
            }
        });

        it('should reject if SendMax value is greater than the available balance for the native asset', async () => {
            const { tx, meta } = checkCreateTemplate;
            const instance = new CheckCreate(tx, meta);

            (LedgerService.getAccountAvailableBalance as jest.Mock).mockResolvedValueOnce(50);

            await expect(CheckCreateValidation(instance)).rejects.toThrow(
                Localize.t('send.insufficientBalanceSpendableBalance', {
                    spendable: Localize.formatNumber(50),
                    currency: 'XRP',
                }),
            );
        });

        it('should reject if IOU balance is less than SendMax', async () => {
            const { tx, meta } = checkCreateTemplate;
            const instance = new CheckCreate(
                {
                    ...tx,
                    ...{
                        SendMax: {
                            currency: 'USD',
                            issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                            value: '1000',
                        },
                    },
                },
                meta,
            );

            (LedgerService.getFilteredAccountLine as jest.Mock).mockResolvedValueOnce({
                balance: '50',
                currency: 'USD',
            });

            await expect(CheckCreateValidation(instance)).rejects.toThrow(
                Localize.t('send.insufficientBalanceSpendableBalance', {
                    spendable: Localize.formatNumber(50),
                    currency: 'USD',
                }),
            );
        });

        it('should resolve if SendMax is valid for the IOU amount and it does not exceed line balance', async () => {
            const { tx, meta } = checkCreateTemplate;
            const instance = new CheckCreate(
                {
                    ...tx,
                    ...{
                        SendMax: {
                            currency: 'USD',
                            issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                            value: '100',
                        },
                    },
                },
                meta,
            );

            (LedgerService.getFilteredAccountLine as jest.Mock).mockResolvedValueOnce({
                balance: '100',
                currency: 'USD',
            });

            await expect(CheckCreateValidation(instance)).resolves.not.toThrow();
        });

        it('should resolve if SendMax is valid for the native asset and it does not exceed available balance', async () => {
            const { tx, meta } = checkCreateTemplate;
            const instance = new CheckCreate(tx, meta);

            (LedgerService.getAccountAvailableBalance as jest.Mock).mockResolvedValueOnce(100);

            await expect(CheckCreateValidation(instance)).resolves.not.toThrow();
        });
    });
});
