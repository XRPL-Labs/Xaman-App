/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { AMMBid, AMMBidInfo } from '../AMMBid';
import ammBidTemplate from './fixtures/AMMBidTx.json';

jest.mock('@services/NetworkService');

const MixedAMMBid = MutationsMixin(AMMBid);

describe('AMMBid tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AMMBid();
            expect(instance.TransactionType).toBe('AMMBid');
            expect(instance.Type).toBe('AMMBid');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = ammBidTemplate;
            const instance = new AMMBid(tx, meta);

            expect(instance.Asset).toStrictEqual({
                currency: 'XRP',
            });
            expect(instance.Asset2).toStrictEqual({
                currency: 'TST',
                issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
            });
            expect(instance.AuthAccounts[0].Account).toStrictEqual('rMKXGCbJ5d8LbrqthdG46q3f969MVK2Qeg');
            expect(instance.AuthAccounts[1].Account).toStrictEqual('rBepJuTLFJt3WmtLXYAxSjtBWAeQxVbncv');
            expect(instance.BidMax).toStrictEqual({
                currency: '039C99CD9AB0B70B32ECDA51EAAE471625608EA2',
                issuer: 'rE54zDvgnghAoPopCgvtiqWNq3dU5y836S',
                value: '100',
            });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = ammBidTemplate;
        const instance = new MixedAMMBid(tx, meta);
        const info = new AMMBidInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${instance.Type} transaction`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.ammBid'));
            });
        });
    });

    describe('Validation', () => {});
});
