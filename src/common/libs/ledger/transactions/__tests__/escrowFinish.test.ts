/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import EscrowFinish from '../escrowFinish';

import escrowFinishTemplate from './templates/EscrowFinishTx.json';

describe('EscrowFinish tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new EscrowFinish();
        expect(instance.TransactionType).toBe('EscrowFinish');
        expect(instance.Type).toBe('EscrowFinish');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = escrowFinishTemplate;
        const instance = new EscrowFinish(tx, meta);

        expect(instance.Destination).toStrictEqual({
            tag: undefined,
            address: 'rKwJaGmB5Hz24Qs2iyCaTdUuL1WsEXUWy5',
        });
        expect(instance.Amount).toStrictEqual({
            currency: 'XRP',
            value: '500000000',
        });

        expect(instance.Owner).toBe(tx.Owner);

        expect(instance.Fulfillment).toBe(tx.Fulfillment);
        expect(instance.Condition).toBe(tx.Condition);

        expect(instance.OfferSequence).toBe(tx.OfferSequence);
    });

    it('it should calcualte right fee with fulfillment ', () => {
        const { tx, meta } = escrowFinishTemplate;
        const instance = new EscrowFinish(tx, meta);
        expect(instance.calculateFee()).toBe('402');
    });
});
