/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import PaymentChannelFund from '../paymentChannelFund';

import paymentChannelFundTemplates from './templates/PaymentChannelFundTx.json';

describe('PaymentChannelFund tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new PaymentChannelFund();
        expect(instance.TransactionType).toBe('PaymentChannelFund');
        expect(instance.Type).toBe('PaymentChannelFund');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = paymentChannelFundTemplates;
        const instance = new PaymentChannelFund(tx, meta);

        expect(instance.Account).toEqual({
            address: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            tag: undefined,
        });
        expect(instance.Type).toBe('PaymentChannelFund');
        expect(instance.Channel).toBe('C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198');
        expect(instance.Amount).toEqual({ currency: 'XRP', value: '0.2' });
        expect(instance.Expiration).toBe('2017-03-18T16:59:18.000Z');
    });
});
