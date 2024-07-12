/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { NFTokenCreateOffer, NFTokenCreateOfferInfo } from '../NFTokenCreateOffer';
import nfTokenCreateOfferTemplate from './fixtures/NFTokenCreateOfferTx.json';

jest.mock('@services/NetworkService');

describe('NFTokenCreateOffer tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new NFTokenCreateOffer();
            expect(instance.TransactionType).toBe('NFTokenCreateOffer');
            expect(instance.Type).toBe('NFTokenCreateOffer');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = nfTokenCreateOfferTemplate.sellOffer;
            const instance = new NFTokenCreateOffer(tx, meta);

            expect(instance.Amount).toStrictEqual({
                value: '1',
                currency: 'XRP',
            });
            expect(instance.NFTokenID).toEqual('000100001E962F495F07A990F4ED55ACCFEEF365DBAA76B6A048C0A200000007');
            expect(instance.Owner).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.Destination).toBe('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.Expiration).toBe('2018-01-24T12:52:01.000Z');
        });
    });

    describe('Info', () => {
        const Mixed = MutationsMixin(NFTokenCreateOffer);
        const sellInstance = new Mixed(
            nfTokenCreateOfferTemplate.sellOffer.tx as any,
            nfTokenCreateOfferTemplate.sellOffer.meta as any,
        );
        const buyInstance = new Mixed(
            nfTokenCreateOfferTemplate.buyOffer.tx as any,
            nfTokenCreateOfferTemplate.buyOffer.meta as any,
        );

        describe('generateDescription()', () => {
            it('should return the expected description for sell offer', () => {
                const info = new NFTokenCreateOfferInfo(sellInstance, {} as any);
                const expectedDescription = `rrrrrrrrrrrrrrrrrrrrrholvtp offered to sell NFT token with ID 000100001E962F495F07A990F4ED55ACCFEEF365DBAA76B6A048C0A200000007 in order to receive 1 XRP${'\n'}The NFT owner is rrrrrrrrrrrrrrrrrrrrbzbvji${'\n'}This offer may only be accepted by rrrrrrrrrrrrrrrrrrrrrholvtp${'\n'}The offer expires at Wednesday, January 24, 2018 1:52 PM unless it is canceled or accepted before then.`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected description for buy offer', () => {
                const info = new NFTokenCreateOfferInfo(buyInstance, {} as any);
                const expectedDescription =
                    'rrrrrrrrrrrrrrrrrrrrrholvtp offered to pay 1 XRP in order to receive NFT token with ID 000100001E962F495F07A990F4ED55ACCFEEF365DBAA76B6A048C0A200000007';

                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                const info = new NFTokenCreateOfferInfo(buyInstance, {} as any);
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createNFTOffer'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants for buy offer', () => {
                const info = new NFTokenCreateOfferInfo(buyInstance, {} as any);
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                    end: undefined,
                });
            });
            it('should return the expected participants for sell offer', () => {
                const info = new NFTokenCreateOfferInfo(sellInstance, {} as any);
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details for buy offer', () => {
                const info = new NFTokenCreateOfferInfo(buyInstance, {} as any);
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'DEC',
                            currency: 'XRP',
                            effect: 'POTENTIAL_EFFECT',
                            value: '1',
                        },
                    ],
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                });
            });

            it('should return the expected monetary details for sell offer', () => {
                const info = new NFTokenCreateOfferInfo(sellInstance, {} as any);
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'INC',
                            currency: 'XRP',
                            effect: 'POTENTIAL_EFFECT',
                            value: '1',
                        },
                    ],
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                });
            });
        });
    });

    describe('Validation', () => {});
});
