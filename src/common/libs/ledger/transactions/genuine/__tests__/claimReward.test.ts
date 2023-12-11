/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { ClaimReward, ClaimRewardInfo } from '../ClaimReward';

import { ClaimRewardStatus } from '@common/libs/ledger/parser/types';

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
            const { tx, meta } = claimRewardTemplates.Emitted;
            const instance = new ClaimReward(tx, meta);
            expect(instance.TransactionType).toBe('ClaimReward');
            expect(instance.Issuer).toBe(claimRewardTemplates.Emitted.tx.Issuer);
            expect(instance.ClaimStatus).toBe(ClaimRewardStatus.OptOut);
        });

        it('Should return right parsed values [OptIn]', () => {
            const { tx, meta } = claimRewardTemplates.OptIn;
            const instance = new ClaimReward(tx, meta);
            expect(instance.TransactionType).toBe('ClaimReward');
            expect(instance.Issuer).toBe(claimRewardTemplates.Emitted.tx.Issuer);
            expect(instance.ClaimStatus).toBe(ClaimRewardStatus.OptIn);
        });
    });

    describe('Info', () => {
        const emittedInstance = new ClaimReward(claimRewardTemplates.Emitted.tx, claimRewardTemplates.Emitted.meta);
        const optInInstance = new ClaimReward(claimRewardTemplates.OptIn.tx, claimRewardTemplates.OptIn.meta);

        describe('getDescription()', () => {
            it('should return the expected description [OptOut]', () => {
                const expectedDescription = `${Localize.t('events.claimRewardExplain')}\n${Localize.t(
                    'events.claimRewardExplainOptOut',
                    { address: emittedInstance.Account.address },
                )}`;
                expect(ClaimRewardInfo.getDescription(emittedInstance)).toEqual(expectedDescription);
            });

            it('should return the expected description [OptIn]', () => {
                const expectedDescription = `${Localize.t('events.claimRewardExplain')}`;
                expect(ClaimRewardInfo.getDescription(optInInstance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label [OptOut]', () => {
                expect(ClaimRewardInfo.getLabel(emittedInstance)).toEqual(Localize.t('events.claimRewardOptOut'));
            });

            it('should return the expected label [OptIn]', () => {
                expect(ClaimRewardInfo.getLabel(optInInstance)).toEqual(Localize.t('events.claimReward'));
            });
        });
    });

    describe('Validation', () => {});
});
