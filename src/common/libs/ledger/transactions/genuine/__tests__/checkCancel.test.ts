/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { CheckCancel, CheckCancelInfo, CheckCancelValidation } from '../CheckCancel';
import { CheckCreate } from '../CheckCreate';

import checkCancelTemplates from './fixtures/CheckCancelTx.json';
import checkCreateTemplate from './fixtures/CheckCreateTx.json';

jest.mock('@services/NetworkService');

const MixedCheckCancel = MutationsMixin(CheckCancel);

describe('CheckCancel', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new CheckCancel();
            expect(instance.TransactionType).toBe('CheckCancel');
            expect(instance.Type).toBe('CheckCancel');
        });

        it('Should return right parsed values', () => {
            // @ts-ignore
            const { tx, meta }: any = checkCancelTemplates;
            const instance = new CheckCancel(tx, meta);

            expect(instance.CheckID).toBe('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
        });

        it('Should set check object', () => {
            // @ts-ignore
            const { tx, meta }: any = checkCancelTemplates;
            const instance = new CheckCancel(tx, meta);

            instance.Check = new CheckCreate(checkCreateTemplate.tx as any);

            expect(instance.Check).toBeDefined();
            expect(instance.isExpired).toBe(true);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = checkCancelTemplates;
        const instance = new MixedCheckCancel(tx, meta);
        const info = new CheckCancelInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription =
                    'The transaction will cancel check with ID xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.cancelCheck'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rAccountxxxxxxxxxxxxxxxxxxxxxxxxxx', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {
        let instance: CheckCancel;

        beforeAll(() => {
            const { tx, meta }: any = checkCancelTemplates;
            instance = new CheckCancel(tx, meta);

            instance.Check = new CheckCreate(checkCreateTemplate.tx as any);
        });

        it('should resolve if Check is expired', async () => {
            expect(instance.isExpired).toBe(true);
            await expect(CheckCancelValidation(instance)).resolves.toBeUndefined();
        });

        it('should reject with an error if Check object is not present', async () => {
            // clear check object
            instance.Check = undefined as any;

            await expect(CheckCancelValidation(instance)).rejects.toThrowError(
                Localize.t('payload.unableToGetCheckObject'),
            );
        });

        it('should reject if Check is not expired and Account address does not match Check Destination or Account addresses', async () => {
            const tx = {
                Check: {
                    Destination: 'destAddress',
                    Account: 'accAddress',
                },
                isExpired: false,
                Account: 'otherAddress',
            };

            instance.Check = new CheckCreate({
                Account: 'rAccountxxxxxxxxxxxxxxxxxxxxxxxxxx',
                Destination: 'rDestinationxxxxxxxxxxxxxxxxxxxxxx',
            } as any);

            instance.Account = 'rXUMMaPpZqPutoRszR29jtC8amWq3APkx';

            await expect(CheckCancelValidation(tx as any)).rejects.toThrowError(
                Localize.t('payload.nonExpiredCheckCanOnlyCancelByCreatedAccount'),
            );
        });
    });
});
