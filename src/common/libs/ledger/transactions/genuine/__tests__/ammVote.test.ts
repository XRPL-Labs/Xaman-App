/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { AMMVote, AMMVoteInfo } from '../AMMVote';
import ammVoteTemplate from './fixtures/AMMVoteTx.json';

jest.mock('@services/NetworkService');

describe('AMMVote tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AMMVote();
            expect(instance.TransactionType).toBe('AMMVote');
            expect(instance.Type).toBe('AMMVote');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = ammVoteTemplate;
            const instance = new AMMVote(tx, meta);

            expect(instance.Asset).toStrictEqual({ currency: 'XRP' });
            expect(instance.Asset2).toStrictEqual({ currency: 'ETH', issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9' });
            expect(instance.TradingFee).toBe(0.234);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = ammVoteTemplate;
        const Mixed = MutationsMixin(AMMVote);
        const instance = new Mixed(tx, meta);
        const info = new AMMVoteInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${instance.Type} transaction`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });
        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.ammVote'));
            });
        });
    });

    describe('Validation', () => {});
});
