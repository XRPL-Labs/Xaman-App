/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { Clawback, ClawbackInfo } from '../Clawback';
import clawbackTemplate from './fixtures/ClawbackTx.json';

jest.mock('@services/NetworkService');

describe('Clawback tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new Clawback();
            expect(instance.TransactionType).toBe('Clawback');
            expect(instance.Type).toBe('Clawback');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = clawbackTemplate;
            const instance = new Clawback(tx, meta);

            expect(instance.Amount).toBe({
                currency: 'FOO',
                issuer: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
                value: '314.159',
            });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = clawbackTemplate;
        const Mixed = MutationsMixin(Clawback);
        const instance = new Mixed(tx, meta);
        const info = new ClawbackInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an Clawback transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.clawback'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rYNKrtQaf3vUVWVK5sw9rJdPGDLbxZu89', tag: undefined },
                    end: { address: 'r3CAQrWrJCFFnNf6mbUtCBUPtuqAb4odbC', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        DEC: [],
                        INC: [
                            {
                                action: 'INC',
                                currency: '594F494E4B000000000000000000000000000000',
                                issuer: 'r3CAQrWrJCFFnNf6mbUtCBUPtuqAb4odbC',
                                value: '1',
                            },
                        ],
                    },
                    factor: [
                        {
                            currency: '594F494E4B000000000000000000000000000000',
                            effect: 'IMMEDIATE_EFFECT',
                            value: '1',
                        },
                    ],
                });
            });
        });
    });

    describe('Validation', () => {});
});
