/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { FallbackTransaction, FallbackTransactionInfo } from '..';

import fallbackTemplate from './fixtures/FallbackTx.json';
import { OperationActions } from '../../../parser/types';

jest.mock('@services/NetworkService');

describe('Fallback tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const { tx, meta }: any = fallbackTemplate;
            const instance = new FallbackTransaction(tx, meta);
            expect(instance.TransactionType).toBe('DIDSet');
            expect(instance.Type).toBe('__fallback_transactions');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = fallbackTemplate;
        const Mixed = MutationsMixin(FallbackTransaction);
        const instance = new Mixed(tx, meta);
        const info = new FallbackTransactionInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${tx.TransactionType} transaction`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(tx.TransactionType);
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({});
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        [OperationActions.DEC]: [],
                        [OperationActions.INC]: [],
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
