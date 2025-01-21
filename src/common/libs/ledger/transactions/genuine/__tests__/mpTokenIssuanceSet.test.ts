/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { MPTokenIssuanceSet, MPTokenIssuanceSetInfo } from '../MPTokenIssuanceSet';
import mpTokenIssuanceSetTemplate from './fixtures/MPTokenIssuanceSetTx.json';

jest.mock('@services/NetworkService');

describe('MPTokenIssuanceSet tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new MPTokenIssuanceSet();
            expect(instance.TransactionType).toBe('MPTokenIssuanceSet');
            expect(instance.Type).toBe('MPTokenIssuanceSet');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = mpTokenIssuanceSetTemplate;
            const instance = new MPTokenIssuanceSet(tx, meta);

            expect(instance.MPTokenIssuanceID).toBe('004FD5D21BFB1ECDCD89560CBB2BB21F94559F32820FAD04');
            expect(instance.Holder).toBe('rsYxnKtb8JBzfG4hp6sVF3WiVNw2broUFo');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = mpTokenIssuanceSetTemplate;
        const MixedMPTokenIssuanceSet = MutationsMixin(MPTokenIssuanceSet);
        const instance = new MixedMPTokenIssuanceSet(tx, meta);
        const info = new MPTokenIssuanceSetInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an MPTokenIssuanceSet transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.mpTokenIssuanceSet'));
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
