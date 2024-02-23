/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';
import { ClaimRewardStatus } from '@common/libs/ledger/parser/types';

import { ClaimReward, ClaimRewardInfo } from '../ClaimReward';

import claimRewardTemplates from './fixtures/ClaimRewardTx.json';

jest.mock('@services/NetworkService');

describe('ClaimReward', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new ClaimReward();
            expect(instance.TransactionType).toBe('ClaimReward');
            expect(instance.Type).toBe('ClaimReward');
        });

        it('Should return right parsed values [OptOut]', () => {
            const { tx, meta }: any = claimRewardTemplates.Emitted;
            const instance = new ClaimReward(tx, meta);
            expect(instance.TransactionType).toBe('ClaimReward');
            expect(instance.Issuer).toBe(claimRewardTemplates.Emitted.tx.Issuer);
            expect(instance.ClaimStatus).toBe(ClaimRewardStatus.OptOut);
        });

        it('Should return right parsed values [OptIn]', () => {
            const { tx, meta }: any = claimRewardTemplates.OptIn;
            const instance = new ClaimReward(tx, meta);
            expect(instance.TransactionType).toBe('ClaimReward');
            expect(instance.Issuer).toBe(claimRewardTemplates.Emitted.tx.Issuer);
            expect(instance.ClaimStatus).toBe(ClaimRewardStatus.OptIn);
        });
    });

    describe('Info', () => {
        const MixedClaimReward = MutationsMixin(ClaimReward);
        const emittedInstance = new MixedClaimReward(
            claimRewardTemplates.Emitted.tx as any,
            claimRewardTemplates.Emitted.meta as any,
        );
        const optInInstance = new MixedClaimReward(
            claimRewardTemplates.OptIn.tx as any,
            claimRewardTemplates.OptIn.meta as any,
        );

        describe('generateDescription()', () => {
            it('should return the expected description [OptOut]', () => {
                const info = new ClaimRewardInfo(emittedInstance, {} as any);
                const expectedDescription = `This is a claim reward transaction${'\n'}This transaction opts out rrrrrrrrrrrrrrrrrrrrrhoLvTp to claim rewards in future`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected description [OptIn]', () => {
                const info = new ClaimRewardInfo(optInInstance, {} as any);
                const expectedDescription = 'This is a claim reward transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label [OptOut]', () => {
                const info = new ClaimRewardInfo(emittedInstance, {} as any);
                expect(info.getEventsLabel()).toEqual(Localize.t('events.claimRewardOptOut'));
            });

            it('should return the expected label [OptIn]', () => {
                const info = new ClaimRewardInfo(optInInstance, {} as any);
                expect(info.getEventsLabel()).toEqual(Localize.t('events.claimReward'));
            });
        });
    });

    describe('Validation', () => {});
});
