/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';
import moment from 'moment-timezone';

import NetworkService from '@services/NetworkService';

import { OfferCreate, OfferCreateInfo } from '../OfferCreate';
import offerCreateTemplates from './fixtures/OfferCreateTx.json';

import { NormalizeCurrencyCode } from '../../../../../utils/amount';
import { OperationActions } from '../../../parser/types';

jest.mock('@services/NetworkService');

describe('OfferCreate tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new OfferCreate();
            expect(instance.TransactionType).toBe('OfferCreate');
            expect(instance.Type).toBe('OfferCreate');
        });

        it('Should return right parsed values for executed order XRP->IOU', () => {
            const { tx, meta } = offerCreateTemplates.XRPIOU;
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
            expect(instance.TakerPaid()).toStrictEqual({
                action: OperationActions.INC,
                currency: 'BTC',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '0.01257026',
            });
            expect(instance.TakerGets).toStrictEqual({
                currency: 'XRP',
                value: '500',
            });
            expect(instance.TakerGot()).toStrictEqual({
                issuer: undefined,
                action: OperationActions.DEC,
                currency: 'XRP',
                value: '500',
            });
        });

        it('Should return right parsed values for executed order IOU->XRP', () => {
            const { tx, meta } = offerCreateTemplates.IOUXRP;
            const instance = new OfferCreate(tx, meta);

            expect(instance.GetOfferStatus(tx.Account)).toBe('FILLED');
            expect(instance.OfferSequence).toBe(112);
            expect(instance.Rate).toBe(0.000025941414017897298);
            expect(instance.Expiration).toBe('2021-09-20T09:38:28.000Z');

            expect(instance.TakerPays).toStrictEqual({
                currency: 'XRP',
                value: '484.553386',
            });
            expect(instance.TakerPaid()).toStrictEqual({
                issuer: undefined,
                action: OperationActions.INC,
                currency: 'XRP',
                value: '501.44754',
            });
            expect(instance.TakerGets).toStrictEqual({
                currency: 'BTC',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '0.01257',
            });
            expect(instance.TakerGot()).toStrictEqual({
                action: OperationActions.DEC,
                currency: 'BTC',
                issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
                value: '0.01257026',
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
            const { tx, meta } = offerCreateTemplates.XRPIOUDifferentOwner;
            const instance = new OfferCreate(tx, meta);

            expect(instance.GetOfferStatus('rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ')).toBe('PARTIALLY_FILLED');
            expect(instance.OfferSequence).toBe(56270334);
            expect(instance.Rate).toBe(0.38076);
            expect(instance.Expiration).toBe(undefined);

            expect(instance.TakerGets).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });
            expect(instance.TakerGot('rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ')).toStrictEqual({
                action: OperationActions.DEC,
                currency: '534F4C4F00000000000000000000000000000000',
                issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
                value: '38.46538462',
            });
            expect(instance.TakerPays).toStrictEqual({
                currency: '534F4C4F00000000000000000000000000000000',
                issuer: 'rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz',
                value: '38.076',
            });
            expect(instance.TakerPaid('rwietsevLFg8XSmG3bEZzFein1g8RBqWDZ')).toStrictEqual({
                issuer: undefined,
                action: OperationActions.INC,
                currency: 'XRP',
                value: '100',
            });
        });

        it('Should return zero for taker got and taker paid if order cancelled or killed', () => {
            const { tx, meta } = offerCreateTemplates.XRPIOUCANCELED;
            const instance = new OfferCreate(tx, meta);

            // expect(instance.Executed).toBe(true);
            expect(instance.OfferSequence).toBe(61160755);

            expect(instance.TakerGets).toStrictEqual({
                currency: 'XRP',
                value: '50',
            });
            expect(instance.TakerGot('rQamE9ddZiRZLKRAAzwGKboQ8rQHgesjEs')).toStrictEqual({
                currency: 'XRP',
                value: '0',
            });
            expect(instance.TakerPays).toStrictEqual({
                currency: 'CSC',
                issuer: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr',
                value: '11616.66671104',
            });
            expect(instance.TakerPaid('rQamE9ddZiRZLKRAAzwGKboQ8rQHgesjEs')).toStrictEqual({
                currency: 'CSC',
                issuer: 'rCSCManTZ8ME9EoLrSHHYKW8PPwWMgkwr',
                value: '0',
            });
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = offerCreateTemplates.IOUXRP;
                const instance = new OfferCreate(tx, meta);

                const expectedDescription = `${Localize.t('events.offerTransactionExplain', {
                    address: instance.Account.address,
                    takerGetsValue: instance.TakerGets.value,
                    takerGetsCurrency: NormalizeCurrencyCode(instance.TakerGets.currency),
                    takerPaysValue: instance.TakerPays.value,
                    takerPaysCurrency: NormalizeCurrencyCode(instance.TakerPays.currency),
                })}\n${Localize.t('events.theExchangeRateForThisOfferIs', {
                    rate: instance.Rate,
                    takerPaysCurrency:
                        instance.TakerGets.currency === NetworkService.getNativeAsset()
                            ? NormalizeCurrencyCode(instance.TakerPays.currency)
                            : NormalizeCurrencyCode(instance.TakerGets.currency),
                    takerGetsCurrency:
                        instance.TakerGets.currency !== NetworkService.getNativeAsset()
                            ? NormalizeCurrencyCode(instance.TakerPays.currency)
                            : NormalizeCurrencyCode(instance.TakerGets.currency),
                })}\n${Localize.t('events.theTransactionIsAlsoCancelOffer', {
                    address: instance.Account.address,
                    offerSequence: instance.OfferSequence,
                })}\n${Localize.t('events.theTransactionHasAOfferId', { offerId: tx.OfferID })}\n${Localize.t(
                    'events.theOfferExpiresAtUnlessCanceledOrConsumed',
                    {
                        expiration: moment(instance.Expiration).format('LLLL'),
                    },
                )}`;

                expect(OfferCreateInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                const { tx, meta } = offerCreateTemplates.IOUXRP;
                const instance = new OfferCreate(tx, meta);
                // @ts-ignore
                expect(OfferCreateInfo.getLabel(instance, { address: tx.Account })).toEqual(
                    Localize.t('events.exchangedAssets'),
                );
            });
        });
    });

    describe('Validation', () => {});
});
