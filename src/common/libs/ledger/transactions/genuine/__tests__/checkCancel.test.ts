/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { CheckCancel, CheckCancelInfo, CheckCancelValidation } from '../CheckCancel';
import { CheckCreate } from '../CheckCreate';

import checkCancelTemplates from './fixtures/CheckCancelTx.json';
import checkCreateTemplate from './fixtures/CheckCreateTx.json';

jest.mock('@services/NetworkService');

describe('CheckCancel', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new CheckCancel();
            expect(instance.TransactionType).toBe('CheckCancel');
            expect(instance.Type).toBe('CheckCancel');
        });

        it('Should return right parsed values', () => {
            // @ts-ignore
            const { tx, meta } = checkCancelTemplates;
            const instance = new CheckCancel(tx, meta);

            expect(instance.CheckID).toBe('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        });

        it('Should set check object', () => {
            // @ts-ignore
            const { tx, meta } = checkCancelTemplates;
            const instance = new CheckCancel(tx, meta);

            instance.Check = new CheckCreate(checkCreateTemplate.tx);

            expect(instance.Check).toBeDefined();
            expect(instance.isExpired).toBe(true);
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = checkCancelTemplates;
                const instance = new CheckCancel(tx, meta);

                const expectedDescription = `${Localize.t('events.theTransactionWillCancelCheckWithId', {
                    checkId: tx.CheckID,
                })}`;

                expect(CheckCancelInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(CheckCancelInfo.getLabel()).toEqual(Localize.t('events.cancelCheck'));
            });
        });
    });

    describe('Validation', () => {
        let instance: CheckCancel;

        beforeAll(() => {
            const { tx, meta } = checkCancelTemplates;
            instance = new CheckCancel(tx, meta);

            instance.Check = new CheckCreate(checkCreateTemplate.tx);
        });

        it('should resolve if Check is expired', async () => {
            expect(instance.isExpired).toBe(true);
            await expect(CheckCancelValidation(instance)).resolves.toBeUndefined();
        });

        it('should reject with an error if Check object is not present', async () => {
            instance.Check = undefined;

            await expect(CheckCancelValidation(instance)).rejects.toThrowError(
                Localize.t('payload.unableToGetCheckObject'),
            );
        });

        it('should reject if Check is not expired and Account address does not match Check Destination or Account addresses', async () => {
            const tx = {
                Check: {
                    Destination: { address: 'destAddress' },
                    Account: { address: 'accAddress' },
                },
                isExpired: false,
                Account: { address: 'otherAddress' },
            };

            instance.Check = new CheckCreate({
                Account: 'rAccountxxxxxxxxxxxxxxxxxxxxxxxxxx',
                Destination: 'rDestinationxxxxxxxxxxxxxxxxxxxxxx',
            });

            instance.Account = {
                address: 'rOtherAccountxxxxxxxxxxxxxxxxxxxxxxxxxx',
            };

            await expect(CheckCancelValidation(tx as any)).rejects.toThrowError(
                Localize.t('payload.nonExpiredCheckCanOnlyCancelByCreatedAccount'),
            );
        });
    });
});
