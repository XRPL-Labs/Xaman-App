/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { OracleDelete, OracleDeleteInfo } from '../OracleDelete';
import oracleDeleteTemplate from './fixtures/OracleDeleteTx.json';

jest.mock('@services/NetworkService');

describe('OracleDelete tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new OracleDelete();
            expect(instance.TransactionType).toBe('OracleDelete');
            expect(instance.Type).toBe('OracleDelete');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = oracleDeleteTemplate;
            const instance = new OracleDelete(tx, meta);

            expect(instance.OracleDocumentID).toBe(1337);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = oracleDeleteTemplate;
        const Mixed = MutationsMixin(OracleDelete);
        const instance = new Mixed(tx, meta);
        const info = new OracleDeleteInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an OracleDelete transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.oracleDelete'));
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
