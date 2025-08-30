/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { MPTokenIssuanceDestroy, MPTokenIssuanceDestroyInfo } from '../MPTokenIssuanceDestroy';
import MPTokenIssuanceDestroyTemplate from './fixtures/MPTokenIssuanceDestroyTx.json';

jest.mock('@services/NetworkService');

describe('MPTokenIssuanceDestroy tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new MPTokenIssuanceDestroy();
            expect(instance.TransactionType).toBe('MPTokenIssuanceDestroy');
            expect(instance.Type).toBe('MPTokenIssuanceDestroy');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = MPTokenIssuanceDestroyTemplate;
            const instance = new MPTokenIssuanceDestroy(tx, meta);

            expect(instance.MPTokenIssuanceID).toBe('004FD5D21BFB1ECDCD89560CBB2BB21F94559F32820FAD04');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = MPTokenIssuanceDestroyTemplate;
        const MixedMPTokenIssuanceDestroy = MutationsMixin(MPTokenIssuanceDestroy);
        const instance = new MixedMPTokenIssuanceDestroy(tx, meta);
        const info = new MPTokenIssuanceDestroyInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an MPTokenIssuanceDestroy transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.mpTokenIssuanceDestroy'));
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
