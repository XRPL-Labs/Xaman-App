/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import EscrowFinish from '../escrowFinish';

import txTemplates from './templates/EscrowFinishTx.json';

describe('EscrowFinish tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new EscrowFinish();
        expect(instance.Type).toBe('EscrowFinish');
    });

    it('Should return right parsed values', () => {
        // @ts-ignore
        const instance = new EscrowFinish(txTemplates);

        expect(instance.Destination).toStrictEqual({
            tag: undefined,
            address: 'rKwJaGmB5Hz24Qs2iyCaTdUuL1WsEXUWy5',
        });
        expect(instance.Amount).toStrictEqual({
            currency: 'XRP',
            value: '500000000',
        });

        expect(instance.Owner).toBe(txTemplates.tx.Owner);

        expect(instance.Fulfillment).toBe(txTemplates.tx.Fulfillment);
        expect(instance.Condition).toBe(txTemplates.tx.Condition);

        expect(instance.OfferSequence).toBe(txTemplates.tx.OfferSequence);
    });

    it('it should calcualte right fee', () => {
        const instance = new EscrowFinish(txTemplates);

        expect(instance.calculateFee()).toBe('402');
    });
});
