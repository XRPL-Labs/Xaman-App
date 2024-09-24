/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { NFTokenAcceptOffer, NFTokenAcceptOfferInfo } from '../NFTokenAcceptOffer';
import nFTokenAcceptOfferTemplate from './fixtures/NFTokenAcceptOfferTx.json';

jest.mock('@services/NetworkService');

describe('NFTokenAcceptOffer', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new NFTokenAcceptOffer();
            expect(instance.TransactionType).toBe('NFTokenAcceptOffer');
            expect(instance.Type).toBe('NFTokenAcceptOffer');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = nFTokenAcceptOfferTemplate;
            const instance = new NFTokenAcceptOffer(tx, meta);

            expect(instance.NFTokenSellOffer).toBe('D68E2D453EBA6468C3BE8FFE4F73EA077A5B7EE6712082D213212D83FDF7245E');
            expect(instance.NFTokenBuyOffer).toBe('13471FEBC1F76E6174D4FE5E334BD8DF1C7243EFFD7583A5DDB75DD2EC3CB347');
            expect(instance.NFTokenBrokerFee).toStrictEqual({
                currency: 'XRP',
                value: '1',
            });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = nFTokenAcceptOfferTemplate;
        const MixedNFTokenAcceptOffer = MutationsMixin(NFTokenAcceptOffer);
        const instance = new MixedNFTokenAcceptOffer(tx, meta);
        const info = new NFTokenAcceptOfferInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `rrrrrrrrrrrrrrrrrrrrbzbvji accepted NFT token offer with ID 13471FEBC1F76E6174D4FE5E334BD8DF1C7243EFFD7583A5DDB75DD2EC3CB347 for NFT token with ID 000800006203F49C21D5D6E022CB16DE3538F248662FC73C216B9CBF00000023 in order to receive 0.000102 XRP${'\n'}Broker fee for this offer is 1 XRP`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.acceptNFTOffer'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'r9AExd6v3keXaXa3nXAMHHcP9nWy9Aef2g' },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrbzbvji' },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                // TODO: check me
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'DEC',
                            currency: 'XRP',
                            effect: 'IMMEDIATE_EFFECT',
                            value: '0.000102',
                        },
                    ],
                    mutate: {
                        DEC: [
                            {
                                action: 'DEC',
                                currency: 'XRP',
                                value: '0.000102',
                            },
                        ],
                        INC: [],
                    },
                });
            });
        });
    });

    describe('Validation', () => {});
});
