/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { EscrowCreate, EscrowCreateInfo } from '../EscrowCreate';
import escrowCreateTemplate from './fixtures/EscrowCreateTx.json';

jest.mock('@services/NetworkService');

describe('EscrowCreate', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new EscrowCreate();
            expect(instance.TransactionType).toBe('EscrowCreate');
            expect(instance.Type).toBe('EscrowCreate');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = escrowCreateTemplate;
            const instance = new EscrowCreate(tx, meta);

            expect(instance.Destination).toEqual('rLbgNAngLq3HABBXK4uPGCHrqeZwgaYi7q');
            expect(instance.DestinationTag).toEqual(23480);

            expect(instance.Amount).toStrictEqual({
                currency: 'XRP',
                value: '997.5',
            });

            expect(instance.Condition).toBe(
                'A0258020886F982742772F414243855DC13B348FC78FB3D5119412C8A6480114E36A4451810120',
            );

            expect(instance.CancelAfter).toBe('2020-03-01T08:54:20.000Z');
            expect(instance.FinishAfter).toBe('2020-03-01T09:01:00.000Z');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = escrowCreateTemplate;
        const Mixed = MutationsMixin(EscrowCreate);
        const instance = new Mixed(tx, meta);
        const info = new EscrowCreateInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The escrow is from rLbgNAngLq3HABBXK4uPGCHrqeZwgaYi8q to rLbgNAngLq3HABBXK4uPGCHrqeZwgaYi7q${'\n'}The escrow has a destination tag: 23480${'\n'}It escrowed 997.5 XRP${'\n'}It can be cancelled after Sunday, March 1, 2020 9:54 AM${'\n'}It can be finished after Sunday, March 1, 2020 10:01 AM`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createEscrow'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rLbgNAngLq3HABBXK4uPGCHrqeZwgaYi8q', tag: undefined },
                    end: { address: 'rLbgNAngLq3HABBXK4uPGCHrqeZwgaYi7q', tag: 23480 },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                // TODO: check me
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        sent: {
                            currency: 'XRP',
                            value: '997.5',
                            action: 0,
                        },
                        received: undefined,
                    },
                    factor: { currency: 'XRP', value: '997.5', effect: 1 },
                });
            });
        });
    });

    describe('Validation', () => {});
});
