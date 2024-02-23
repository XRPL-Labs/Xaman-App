/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';
import LedgerService from '@services/LedgerService';
import { MutationsMixin } from '@common/libs/ledger/mixin';

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
            const { tx, meta }: any = checkCreateTemplate;
            const instance = new CheckCreate(tx, meta);

            expect(instance.SendMax).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });

            expect(instance.Expiration).toBe('2018-01-24T12:52:01.000Z');

            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrn5RM1rHd');
            expect(instance.DestinationTag).toEqual(1);

            expect(instance.InvoiceID).toBe('6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B');
        });

        it('Should set/get fields', () => {
            const instance = new CheckCreate();

            instance.SendMax = {
                currency: 'XRP',
                value: '100',
            };
            expect(instance.SendMax).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });

            instance.Destination = 'rrrrrrrrrrrrrrrrrrrrBZbvji';
            instance.DestinationTag = 1337;

            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrrBZbvji');
            expect(instance.DestinationTag).toEqual(1337);

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
        const { tx, meta }: any = checkCreateTemplate;
        const Mixed = MutationsMixin(CheckCreate);
        const instance = new Mixed(tx, meta);
        const info = new CheckCreateInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The check is from rrrrrrrrrrrrrrrrrrrrBZbvji to rrrrrrrrrrrrrrrrrrrn5RM1rHd${'\n'}The Check has a Source Tag: 1337${'\n'}The check has a destination Tag: 1${'\n'}Maximum amount of source currency the Check is allowed to debit the sender is 100 XRP`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createCheck'));
            });
        });
    });

    describe('Validation', () => {
        it('should reject if SendMax is not set or zero', async () => {
            const { tx, meta }: any = checkCreateTemplate;
            const instance = new CheckCreate({ ...tx, ...{ SendMax: undefined } }, meta);

            // when undefined
            await expect(CheckCreateValidation(instance)).rejects.toThrowError(Localize.t('send.pleaseEnterAmount'));

            for await (const v of [
                {
                    currency: 'XRP',
                    value: '0',
                },
                {
                    currency: 'USD',
                    issuer: 'rrrrrrrrrrrrrrrrrrrrBZbvji',
                    value: '0',
                },
            ]) {
                instance.SendMax = v;

                await expect(CheckCreateValidation(instance)).rejects.toThrowError(
                    Localize.t('send.pleaseEnterAmount'),
                );
            }
        });

        it('should reject if SendMax value is greater than the available balance for the native asset', async () => {
            const { tx, meta }: any = checkCreateTemplate;
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
            const { tx, meta }: any = checkCreateTemplate;
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
            const { tx, meta }: any = checkCreateTemplate;
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
            const { tx, meta }: any = checkCreateTemplate;
            const instance = new CheckCreate(tx, meta);

            (LedgerService.getAccountAvailableBalance as jest.Mock).mockResolvedValueOnce(100);

            await expect(CheckCreateValidation(instance)).resolves.not.toThrow();
        });
    });
});
