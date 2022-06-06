/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import EscrowCancel from '../escrowCancel';

import escrowCancelTemplate from './templates/EscrowCancelTx.json';

describe('EscrowCancel tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new EscrowCancel();
        expect(instance.TransactionType).toBe('EscrowCancel');
        expect(instance.Type).toBe('EscrowCancel');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = escrowCancelTemplate;
        const instance = new EscrowCancel(tx, meta);

        expect(instance.Owner).toBe('rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn');

        expect(instance.OfferSequence).toBe(7);
    });
});
