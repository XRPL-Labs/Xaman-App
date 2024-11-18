/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { OracleSet, OracleSetInfo } from '../OracleSet';
import oracleSetTemplate from './fixtures/OracleSetTx.json';

jest.mock('@services/NetworkService');

describe('OracleSet tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new OracleSet();
            expect(instance.TransactionType).toBe('OracleSet');
            expect(instance.Type).toBe('OracleSet');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = oracleSetTemplate;
            const instance = new OracleSet(tx, meta);

            expect(instance.AssetClass).toBe('currency');
            expect(instance.Provider).toBe('provider');
            expect(instance.LastUpdateTime).toBe(1729759640);
            expect(instance.OracleDocumentID).toBe(1337);
            expect(instance.PriceDataSeries).toMatchObject([
                {
                    AssetPrice: '2e4',
                    BaseAsset: 'XRP',
                    QuoteAsset: 'USD',
                    Scale: 3,
                },
            ]);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = oracleSetTemplate;
        const Mixed = MutationsMixin(OracleSet);
        const instance = new Mixed(tx, meta);
        const info = new OracleSetInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an OracleSet transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.oracleSet'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rsYxnKtb8JBzfG4hp6sVF3WiVNw2broUFo', tag: undefined },
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
