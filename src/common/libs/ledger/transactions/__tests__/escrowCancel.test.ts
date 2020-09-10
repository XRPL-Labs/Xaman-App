/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import EscrowCancel from '../escrowCancel';

import txTemplates from './templates/EscrowCancelTx.json';

describe('EscrowCancel tx', () => {
    it('Should set tx type if not set', () => {
        const escrowCancel = new EscrowCancel();
        expect(escrowCancel.Type).toBe('EscrowCancel');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const instance = new EscrowCancel(txTemplates);

        expect(instance.Owner).toBe('rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn');

        expect(instance.OfferSequence).toBe(7);
    });
});
