/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { OfferCreate, OfferCreateInfo } from '../OfferCreate';
import offerCreateTemplates from './fixtures/OfferCreateTx.json';

jest.mock('@services/NetworkService');

describe('OfferCreate tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new OfferCreate();
            expect(instance.TransactionType).toBe('OfferCreate');
            expect(instance.Type).toBe('OfferCreate');
        });

        it('Should return right parsed values for executed order XRP->IOU', () => {
            const { tx, meta }: any = offerCreateTemplates.XRPIOU;
            const instance = new OfferCreate(tx, meta);

            expect(instance.GetOfferStatus(tx.Account)).toBe('FILLED');
            expect(instance.OfferSequence).toBe(94);
            expect(instance.Rate).toBe(0.000024271999999999997);
            expect(instance.Expiration).toBe(undefined);
            expect(instance.OfferID).toBe(tx.OfferID);

            expect(instance.TakerPays).toStrictEqual({
                currency: 'BTC',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '0.012136',
            });
            expect(instance.TakerGets).toStrictEqual({
                currency: 'XRP',
                value: '500',
            });
        });

        it('Should return right parsed values for executed order IOU->XRP', () => {
            const { tx, meta }: any = offerCreateTemplates.IOUXRP;
            const instance = new OfferCreate(tx, meta);

            expect(instance.GetOfferStatus(tx.Account)).toBe('FILLED');
            expect(instance.OfferSequence).toBe(112);
            expect(instance.Rate).toBe(0.000025941414017897298);
            expect(instance.Expiration).toBe('2021-09-20T09:38:28.000Z');

            expect(instance.TakerPays).toStrictEqual({
                currency: 'XRP',
                value: '484.553386',
            });
            expect(instance.TakerGets).toStrictEqual({
                currency: 'BTC',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '0.01257',
            });
        });

        it('Should set right values XRP->IOU ', () => {
            const offer = new OfferCreate();

            offer.TakerGets = { currency: 'XRP', value: '500' };
            offer.TakerPays = { currency: 'BTC', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', value: '0.012136' };
            offer.Expiration = '05 October 2011 14:48 UTC';

            expect(offer.TakerGets).toStrictEqual({
                currency: 'XRP',
                value: '500',
            });

            expect(offer.TakerPays).toStrictEqual({
                currency: 'BTC',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '0.012136',
            });

            expect(offer.Expiration).toBe('2011-10-05T14:48:00.000Z');
        });

        it('Should set right values IOU->XRP ', () => {
            const offer = new OfferCreate();

            offer.TakerPays = { currency: 'XRP', value: '500' };
            offer.TakerGets = { currency: 'BTC', issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B', value: '0.012136' };

            expect(offer.TakerPays).toStrictEqual({
                currency: 'XRP',
                value: '500',
            });

            expect(offer.TakerGets).toStrictEqual({
                currency: 'BTC',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '0.012136',
            });
        });

        it('Should return right parsed values for executed order from another owner', () => {
            const { tx, meta }: any = offerCreateTemplates.XRPIOUDifferentOwner;
            const instance = new OfferCreate(tx, meta);

            expect(instance.GetOfferStatus('rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ')).toBe('PARTIALLY_FILLED');
            expect(instance.OfferSequence).toBe(56270334);
            expect(instance.Rate).toBe(0.38076);
            expect(instance.Expiration).toBe(undefined);

            expect(instance.TakerGets).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });
            expect(instance.TakerPays).toStrictEqual({
                currency: '534F4C4F00000000000000000000000000000000',
                issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
                value: '38.076',
            });
        });

        it('Should return zero for taker got and taker paid if order cancelled or killed', () => {
            const { tx, meta }: any = offerCreateTemplates.XRPIOUCANCELED;
            const instance = new OfferCreate(tx, meta);

            expect(instance.OfferSequence).toBe(61160755);
            expect(instance.TakerGets).toStrictEqual({
                currency: 'XRP',
                value: '50',
            });
            expect(instance.TakerPays).toStrictEqual({
                currency: 'CSC',
                issuer: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr',
                value: '11616.66671104',
            });
        });
    });

    describe('Info', () => {
        describe('IOU->XRP', () => {
            const Mixed = MutationsMixin(OfferCreate);
            const { tx, meta }: any = offerCreateTemplates.IOUXRP;
            const instance = new Mixed(tx, meta);
            const info = new OfferCreateInfo(instance, { address: tx.Account } as any);

            it('should return the expected description', () => {
                const expectedDescription = `rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ offered to pay 0.01257 BTC in order to receive 484.553386 XRP${'\n'}The exchange rate for this offer is 0.000025941414017897298 BTC/XRP${'\n'}The transaction will also cancel rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ 's existing offer #112${'\n'}The transaction offer ID is: EF963D9313AA45E85610598797D1A65E${'\n'}The offer expires at Monday, September 20, 2021 11:38 AM unless canceled or consumed before then.`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.exchangedAssets'));
            });

            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ', tag: undefined },
                });
            });

            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'INC',
                            currency: 'XRP',
                            effect: 'POTENTIAL_EFFECT',
                            value: '484.553386',
                        },
                        {
                            action: 'DEC',
                            currency: 'BTC',
                            effect: 'POTENTIAL_EFFECT',
                            issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                            value: '0.01257',
                        },
                    ],
                    mutate: {
                        DEC: [
                            {
                                action: 'DEC',
                                currency: 'BTC',
                                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                                value: '0.01257026',
                            },
                        ],
                        INC: [
                            {
                                action: 'INC',
                                currency: 'XRP',
                                value: '501.44754',
                            },
                        ],
                    },
                });
            });
        });
        describe('XRP->IOU', () => {
            const Mixed = MutationsMixin(OfferCreate);
            const { tx, meta }: any = offerCreateTemplates.XRPIOU;
            const instance = new Mixed(tx, meta);
            const info = new OfferCreateInfo(instance, { address: tx.Account } as any);

            it('should return the expected description', () => {
                const expectedDescription = `rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ offered to pay 500 XRP in order to receive 0.012136 BTC
The exchange rate for this offer is 0.000024271999999999997 BTC/XRP
The transaction will also cancel rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ 's existing offer #94
The transaction offer ID is: EF963D9313AA45E85610598797D1A65E`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.exchangedAssets'));
            });

            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ', tag: undefined },
                });
            });

            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'INC',
                            currency: 'BTC',
                            effect: 'POTENTIAL_EFFECT',
                            issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                            value: '0.012136',
                        },
                        {
                            action: 'DEC',
                            effect: 'POTENTIAL_EFFECT',
                            value: '500',
                            currency: 'XRP',
                        },
                    ],
                    mutate: {
                        DEC: [
                            {
                                action: 'DEC',
                                currency: 'XRP',
                                value: '500',
                            },
                        ],
                        INC: [
                            {
                                action: 'INC',
                                currency: 'BTC',
                                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                                value: '0.01257026',
                            },
                        ],
                    },
                });
            });
        });
        describe('XRP->IOU [Different Owner]', () => {
            const Mixed = MutationsMixin(OfferCreate);
            const { tx, meta }: any = offerCreateTemplates.XRPIOUDifferentOwner;
            const instance = new Mixed(tx, meta);
            const info = new OfferCreateInfo(instance, { address: 'rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ' } as any);

            it('should return the expected description', () => {
                const expectedDescription = `rsTQsbTfRkqgUxxs8BToD3VdnENaha9UcY offered to pay 100 XRP in order to receive 38.076 SOLO
The exchange rate for this offer is 0.38076 SOLO/XRP
The transaction will also cancel rsTQsbTfRkqgUxxs8BToD3VdnENaha9UcY 's existing offer #56270334`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.exchangedAssets'));
            });

            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: tx.Account, tag: undefined },
                });
            });

            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'INC',
                            effect: 'POTENTIAL_EFFECT',
                            currency: '534F4C4F00000000000000000000000000000000',
                            issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
                            value: '38.076',
                        },
                        {
                            action: 'DEC',
                            effect: 'POTENTIAL_EFFECT',
                            value: '100',
                            currency: 'XRP',
                        },
                    ],
                    mutate: {
                        DEC: [
                            {
                                action: 'DEC',
                                currency: '534F4C4F00000000000000000000000000000000',
                                issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
                                value: '38.46538462',
                            },
                        ],
                        INC: [
                            {
                                action: 'INC',
                                currency: 'XRP',
                                value: '100',
                            },
                        ],
                    },
                });
            });
        });
        describe('XRP->IOU [Canceled]', () => {
            const Mixed = MutationsMixin(OfferCreate);
            const { tx, meta }: any = offerCreateTemplates.XRPIOUCANCELED;
            const instance = new Mixed(tx, meta);
            const info = new OfferCreateInfo(instance, { address: tx.Account } as any);

            it('should return the expected description', () => {
                const expectedDescription = `rQamE9ddZiRZLKRAAzwGKboQ8rQHgesjEs offered to pay 50 XRP in order to receive 11616.66671104 CSC
The exchange rate for this offer is 232.3333342208 CSC/XRP
The transaction will also cancel rQamE9ddZiRZLKRAAzwGKboQ8rQHgesjEs 's existing offer #61160755`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createOffer'));
            });

            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: tx.Account, tag: undefined },
                });
            });

            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'INC',
                            effect: 'POTENTIAL_EFFECT',
                            currency: 'CSC',
                            issuer: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr',
                            value: '11616.66671104',
                        },
                        {
                            action: 'DEC',
                            effect: 'POTENTIAL_EFFECT',
                            value: '50',
                            currency: 'XRP',
                        },
                    ],
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                });
            });
        });
        describe('XRP->IOU [Fee]', () => {
            const Mixed = MutationsMixin(OfferCreate);
            const { tx, meta }: any = offerCreateTemplates.XRPIOUWithFeeConflict;
            const instance = new Mixed(tx, meta);
            const info = new OfferCreateInfo(instance, { address: tx.Account } as any);

            it('should return the expected description', () => {
                const expectedDescription = `rBeSemGtLaHLZXcK1WxutWR339L9ZUz4gh offered to pay 0.6742741104345 SOLO in order to receive 0.000001 XRP
The exchange rate for this offer is 674274.1104345 SOLO/XRP
The transaction will also cancel rBeSemGtLaHLZXcK1WxutWR339L9ZUz4gh 's existing offer #91995334`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.exchangedAssets'));
            });

            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: tx.Account, tag: undefined },
                });
            });

            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            action: 'INC',
                            effect: 'POTENTIAL_EFFECT',
                            currency: 'XRP',
                            value: '0.000001',
                        },
                        {
                            action: 'DEC',
                            effect: 'POTENTIAL_EFFECT',
                            currency: '534F4C4F00000000000000000000000000000000',
                            issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
                            value: '0.6742741104345',
                        },
                    ],
                    mutate: {
                        DEC: [
                            {
                                action: 'DEC',
                                currency: '534F4C4F00000000000000000000000000000000',
                                issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
                                value: '0.000006',
                            },
                        ],
                        INC: [
                            {
                                action: 'INC',
                                currency: 'XRP',
                                value: '0.000001',
                            },
                        ],
                    },
                });
            });
        });
    });

    describe('Validation', () => {});
});
