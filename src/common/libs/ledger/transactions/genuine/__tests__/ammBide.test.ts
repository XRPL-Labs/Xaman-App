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
                currency: 'USD',
                issuer: 'rhpHaFggC92ELty3n3yDEtuFgWxXWkUFET',
            });
            expect(instance.AuthAccounts[0].Account).toStrictEqual('ra8uHq2Qme5j19TqvPzTE2nqT12Zc3xJmK');
            expect(instance.AuthAccounts[1].Account).toStrictEqual('rU6o2YguZi847RaiH2QGTkL4eZWZjbxZvk');
            expect(instance.BidMax).toStrictEqual({
                currency: '03930D02208264E2E40EC1B0C09E4DB96EE197B1',
                issuer: 'rMEdVzU8mtEArzjrN9avm3kA675GX7ez8W',
                value: '500',
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
                        sent: {
                            currency: '03930D02208264E2E40EC1B0C09E4DB96EE197B1',
                            issuer: 'rMEdVzU8mtEArzjrN9avm3kA675GX7ez8W',
                            value: '191.73965',
                            action: 0,
                        },
                        received: undefined,
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
