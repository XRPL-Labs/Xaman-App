/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import PaymentChannelClaim from '../paymentChannelClaim';

import paymentChannelClaimTemplates from './templates/PaymentChannelClaimTx.json';

jest.mock('@services/NetworkService');

describe('PaymentChannelClaim tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new PaymentChannelClaim();
        expect(instance.TransactionType).toBe('PaymentChannelClaim');
        expect(instance.Type).toBe('PaymentChannelClaim');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = paymentChannelClaimTemplates;
        const instance = new PaymentChannelClaim(tx, meta);

        expect(instance.Type).toBe('PaymentChannelClaim');

        expect(instance.Channel).toBe('C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198');
        expect(instance.PublicKey).toBe('32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A');
        expect(instance.Signature).toBe(
            '30440220718D264EF05CAED7C781FF6DE298DCAC68D002562C9BF3A07C1E721B420C0DAB02203A5A4779EF4D2CCC7BC3EF886676D803A9981B928D3B8ACA483B80ECA3CD7B9B',
        );

        expect(instance.Amount).toEqual({ currency: 'XRP', value: '1' });
        expect(instance.Balance).toEqual({ currency: 'XRP', value: '1' });
    });
});
