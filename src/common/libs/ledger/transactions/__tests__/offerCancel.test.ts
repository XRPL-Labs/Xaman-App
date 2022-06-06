/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import OfferCancel from '../offerCancel';

import offerCancelTemplates from './templates/OfferCancelTx.json';

describe('OfferCancel tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new OfferCancel();
        expect(instance.TransactionType).toBe('OfferCancel');
        expect(instance.Type).toBe('OfferCancel');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = offerCancelTemplates;
        const instance = new OfferCancel(tx, meta);

        expect(instance.OfferSequence).toBe(6);
    });
});
