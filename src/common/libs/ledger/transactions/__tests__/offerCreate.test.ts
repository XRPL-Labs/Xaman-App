/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import OfferCreate from '../offerCreate';

import txTemplates from './templates/OfferCreateTx.json';

describe('OfferCreate tx', () => {
    it('Should set tx type if not set', () => {
        const offer = new OfferCreate();
        expect(offer.Type).toBe('OfferCreate');
    });

    it('Should return right parsed values for executed order XRP->IOU', () => {
        const instance = new OfferCreate(txTemplates.XRPIOU);

        expect(instance.Executed).toBe(true);
        expect(instance.OfferSequence).toBe(94);
        expect(instance.Rate).toBe(0.000024);
        expect(instance.Expiration).toBe(undefined);

        expect(instance.TakerPays).toStrictEqual({
            currency: 'BTC',
            issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
            value: '0.012136',
        });
        expect(instance.TakerPaid).toStrictEqual({
            currency: 'BTC',
            issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
            value: '0.01257',
        });
        expect(instance.TakerGets).toStrictEqual({
            currency: 'XRP',
            value: '500',
        });
        expect(instance.TakerGot).toStrictEqual({
            currency: 'XRP',
            value: '500',
        });
    });

    it('Should return right parsed values for executed order IOU->XRP', () => {
        const instance = new OfferCreate(txTemplates.IOUXRP);

        expect(instance.Executed).toBe(true);
        expect(instance.OfferSequence).toBe(112);
        expect(instance.Rate).toBe(0.000026);
        expect(instance.Expiration).toBe(undefined);

        expect(instance.TakerPays).toStrictEqual({
            currency: 'XRP',
            value: '484.553386',
        });
        expect(instance.TakerPaid).toStrictEqual({
            currency: 'XRP',
            value: '501.44754',
        });
        expect(instance.TakerGets).toStrictEqual({
            currency: 'BTC',
            issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
            value: '0.01257',
        });
        expect(instance.TakerGot).toStrictEqual({
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
});
