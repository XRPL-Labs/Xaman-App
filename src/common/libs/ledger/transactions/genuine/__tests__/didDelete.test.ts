/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { DIDDelete, DIDDeleteInfo } from '../DIDDelete';
import didDeleteTemplate from './fixtures/DIDDeleteTx.json';

jest.mock('@services/NetworkService');

describe('DIDDelete tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new DIDDelete();
            expect(instance.TransactionType).toBe('DIDDelete');
            expect(instance.Type).toBe('DIDDelete');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = didDeleteTemplate;
            const instance = new DIDDelete(tx, meta);
            expect(instance.Account).toBe('rwgsEwhLs6dLxTFdLdmmX1x6pZro8UZoqR');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = didDeleteTemplate;
        const Mixed = MutationsMixin(DIDDelete);
        const instance = new Mixed(tx, meta);
        const info = new DIDDeleteInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an DIDDelete transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.didDelete'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rwgsEwhLs6dLxTFdLdmmX1x6pZro8UZoqR', tag: undefined },
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
