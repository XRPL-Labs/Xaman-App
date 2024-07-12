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
            expect(instance.Asset2).toStrictEqual({
                currency: 'USD',
                issuer: 'rhpHaFggC92ELty3n3yDEtuFgWxXWkUFET',
            });
            expect(instance.TradingFee).toBe(0.001);
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

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: {
                        address: 'rUwaiErsYE5kibUUtaPczXZVVd73VNy4R9',
                        tag: undefined,
                    },
                    end: {
                        address: 'rMEdVzU8mtEArzjrN9avm3kA675GX7ez8W',
                        tag: undefined,
                    },
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
