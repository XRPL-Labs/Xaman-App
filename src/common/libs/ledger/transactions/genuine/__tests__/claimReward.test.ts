/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

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

        it('Should return right parsed values [Emitted]', () => {
            const { tx, meta } = claimRewardTemplates.Emitted;
            const instance = new ClaimReward(tx, meta);
            expect(instance.TransactionType).toBe('ClaimReward');
            expect(instance.Issuer).toBe(claimRewardTemplates.Emitted.tx.Issuer);
        });

        it('Should return right parsed values [OptIn]', () => {
            const { tx, meta } = claimRewardTemplates.OptIn;
            const instance = new ClaimReward(tx, meta);
            expect(instance.TransactionType).toBe('ClaimReward');
            expect(instance.Issuer).toBe(claimRewardTemplates.Emitted.tx.Issuer);
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                // const { tx, meta } = checkCreateTemplate;
                // const instance = new CheckCreate(tx, meta);
                //
                // const expectedDescription = `${Localize.t('events.theCheckIsFromTo', {
                //     address: instance.Account.address,
                //     destination: instance.Destination.address,
                // })}\n${Localize.t('events.theCheckHasASourceTag', { tag: instance.Account.tag })}\n${Localize.t(
                //     'events.theCheckHasADestinationTag',
                //     { tag: instance.Destination.tag },
                // )}\n\n${Localize.t('events.maximumAmountCheckIsAllowToDebit', {
                //     value: instance.SendMax.value,
                //     currency: NormalizeCurrencyCode(instance.SendMax.currency),
                // })}`;
                //
                // expect(CheckCreateInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(ClaimRewardInfo.getLabel()).toEqual(Localize.t('events.claimReward'));
            });
        });
    });

    describe('Validation', () => {});
});
