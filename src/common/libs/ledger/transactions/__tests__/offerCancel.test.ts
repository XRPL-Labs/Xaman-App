/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import OfferCancel from '../offerCancel';

import txTemplates from './templates/OfferCancelTx.json';

describe('OfferCancel tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new OfferCancel();
        expect(instance.Type).toBe('OfferCancel');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const instance = new OfferCancel(txTemplates);

        expect(instance.OfferSequence).toBe(6);
    });
});
