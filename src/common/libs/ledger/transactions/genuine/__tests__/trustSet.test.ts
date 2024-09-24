/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { TrustSet, TrustSetInfo } from '../TrustSet';
import trustSetTemplate from './fixtures/TrustSetTx.json';
import { NormalizeCurrencyCode } from '../../../../../utils/amount';

jest.mock('@services/NetworkService');

describe('TrustSet tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new TrustSet();
            expect(instance.TransactionType).toBe('TrustSet');
            expect(instance.Type).toBe('TrustSet');
        });

        it('Should return right parsed values', () => {
            // @ts-ignore
            const { tx, meta } = trustSetTemplate;
            const instance = new TrustSet(tx, meta);

            expect(instance.Currency).toBe('USD');
            expect(instance.Issuer).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.Limit).toBe(100);
            expect(instance.QualityIn).toBe(1);
            expect(instance.QualityOut).toBe(1);
        });

        it('Should set/get fields', () => {
            const instance = new TrustSet();

            instance.Currency = 'USD';
            expect(instance.Currency).toBe('USD');

            instance.Issuer = 'rrrrrrrrrrrrrrrrrrrrbzbvji';
            expect(instance.Issuer).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');

            instance.Limit = 100;
            expect(instance.Limit).toBe(100);
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = trustSetTemplate;
                const instance = new TrustSet(tx, meta);

                // TODO: add more tests for different situations

                const expectedDescription = `${Localize.t('events.itEstablishesTrustLineTo', {
                    limit: instance.Limit,
                    currency: NormalizeCurrencyCode(instance.Currency),
                    issuer: instance.Issuer,
                    address: instance.Account.address,
                })}`;

                // @ts-ignore
                expect(TrustSetInfo.getDescription(instance, { address: tx.Account })).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                const { tx, meta } = trustSetTemplate;
                const instance = new TrustSet(tx, meta);

                // TODO: add more tests for different situations

                // @ts-ignore
                expect(TrustSetInfo.getLabel(instance, { address: tx.Account })).toEqual(
                    Localize.t('events.updatedATrustLine'),
                );
            });
        });
    });

    describe('Validation', () => {});
});
