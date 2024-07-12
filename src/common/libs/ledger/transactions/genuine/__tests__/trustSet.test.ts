/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { TrustSet, TrustSetInfo } from '../TrustSet';
import trustSetTemplate from './fixtures/TrustSetTx.json';

jest.mock('@services/NetworkService');

describe('TrustSet tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new TrustSet();
            expect(instance.TransactionType).toBe('TrustSet');
            expect(instance.Type).toBe('TrustSet');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = trustSetTemplate;
            const instance = new TrustSet(tx, meta);

            expect(instance.Currency).toBe('CNY');
            expect(instance.Issuer).toBe('razqQKzJRdB4UxFPWf5NEpEG3WMkmwgcXA');
            expect(instance.Limit).toBe(1000000000);
            expect(instance.QualityIn).toBe(1);
            expect(instance.QualityOut).toBe(1);
        });

        it('Should set/get fields', () => {
            const instance = new TrustSet();

            instance.LimitAmount = {
                currency: 'USD',
                issuer: 'rrrrrrrrrrrrrrrrrrrrbzbvji',
                value: '100',
            };

            expect(instance.Currency).toBe('USD');
            expect(instance.Issuer).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.Limit).toBe(100);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = trustSetTemplate;
        const Mixed = MutationsMixin(TrustSet);
        const instance = new Mixed(tx, meta);
        const info = new TrustSetInfo(instance, { address: tx.Account } as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription =
                    'It establishes 1000000000 as the maximum amount of CNY from razqQKzJRdB4UxFPWf5NEpEG3WMkmwgcXA that rhr8s3nSVJUFwkApgLP32XyYQXZ28Xphfc is willing to hold.';

                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.addedATrustLine'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rhr8s3nSVJUFwkApgLP32XyYQXZ28Xphfc', tag: undefined },
                    end: { address: 'razqQKzJRdB4UxFPWf5NEpEG3WMkmwgcXA', tag: undefined },
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

    describe('Validation', () => {});
});
