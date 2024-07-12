/* eslint-disable max-len */

import Localize from '@locale';

import { GenesisMint, GenesisMintInfo } from '../GenesisMint';
import GenesisMintTemplate from './fixtures/GenesisMintTx.json';
import { MutationsMixin } from '../../../mixin';

jest.mock('@services/NetworkService');

describe('EnableAmendment', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new GenesisMint();
            expect(instance.TransactionType).toBe('GenesisMint');
            expect(instance.Type).toBe('GenesisMint');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = GenesisMintTemplate;
        const MixedGenesisMint = MutationsMixin(GenesisMint);
        const instanceEnableAmendment = new MixedGenesisMint(tx, meta);
        const info = new GenesisMintInfo(instanceEnableAmendment, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description Authorize', () => {
                const expectedDescription = 'This is an GenesisMint transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label for Authorize', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.genesisMint'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                // TODO: check me
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
