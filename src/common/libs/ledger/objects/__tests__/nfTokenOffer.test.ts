/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { NFTokenOffer, NFTokenOfferInfo } from '../NFTokenOffer';
import nfTokenOfferObjectTemplate from './fixtures/NFTokenOfferObject.json';

jest.mock('@services/NetworkService');

describe('NFTokenOffer object', () => {
    describe('Class', () => {
        const object: any = nfTokenOfferObjectTemplate;
        const instance = new NFTokenOffer(object);

        it('Should return right parsed values', () => {
            expect(instance.Type).toBe('NFTokenOffer');
            expect(instance.LedgerEntryType).toBe('NFTokenOffer');
            expect(instance.Amount).toStrictEqual({
                value: '1',
                currency: 'XRP',
            });
            expect(instance.NFTokenID).toEqual('00081B5825A08C22787716FA031B432EBBC1B101BB54875F0002D2A400000000');
            expect(instance.Owner).toBe('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.Destination).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.Expiration).toBe('2018-01-24T12:52:01.000Z');
            expect(Object.keys(instance.Flags ?? {}).length).toBeGreaterThan(0);
        });
    });

    describe('Info', () => {
        const object: any = nfTokenOfferObjectTemplate;
        const instance = new NFTokenOffer(object);
        const info = new NFTokenOfferInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description for sell offer', () => {
                const expectedDescription = `rrrrrrrrrrrrrrrrrrrrrholvtp offered to sell NFT token with ID 00081B5825A08C22787716FA031B432EBBC1B101BB54875F0002D2A400000000 in order to receive 1 XRP${'\n'}The NFT owner is rrrrrrrrrrrrrrrrrrrrrholvtp${'\n'}This offer may only be accepted by rrrrrrrrrrrrrrrrrrrrbzbvji${'\n'}The offer expires at Wednesday, January 24, 2018 1:52 PM unless it is canceled or accepted before then.`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected labels for incoming offer', () => {
                // sell
                expect(
                    new NFTokenOfferInfo(
                        new NFTokenOffer({ ...nfTokenOfferObjectTemplate, Flags: 1 } as any) as any,
                        {
                            address: 'not_owner',
                        } as any,
                    ).getEventsLabel(),
                ).toEqual(Localize.t('events.nftOfferedToYou'));
                // buy
                expect(
                    new NFTokenOfferInfo(
                        new NFTokenOffer({ ...nfTokenOfferObjectTemplate, Flags: 0 } as any) as any,
                        {
                            address: 'not_owner',
                        } as any,
                    ).getEventsLabel(),
                ).toEqual(Localize.t('events.offerOnYouNFT'));
            });

            it('should return the expected labels for outgoing offer', () => {
                // sell
                expect(
                    new NFTokenOfferInfo(
                        new NFTokenOffer({ ...nfTokenOfferObjectTemplate, Flags: 1 } as any) as any,
                        {
                            address: nfTokenOfferObjectTemplate.Owner,
                        } as any,
                    ).getEventsLabel(),
                ).toEqual(Localize.t('events.sellNFToken'));
                // buy
                expect(
                    new NFTokenOfferInfo(
                        new NFTokenOffer({ ...nfTokenOfferObjectTemplate, Flags: 0 } as any) as any,
                        {
                            address: nfTokenOfferObjectTemplate.Owner,
                        } as any,
                    ).getEventsLabel(),
                ).toEqual(Localize.t('events.buyNFToken'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                    send: { address: 'rrrrrrrrrrrrrrrrrrrrbzbvji', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
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
