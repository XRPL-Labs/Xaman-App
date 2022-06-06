/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import PaymentChannelCreate from '../paymentChannelCreate';

import paymentChannelCreateTemplate from './templates/PaymentChannelCreateTx.json';

describe('PaymentChannelCreate tx', () => {
    it('Should set tx type if not set', () => {
        const instance = new PaymentChannelCreate();
        expect(instance.TransactionType).toBe('PaymentChannelCreate');
        expect(instance.Type).toBe('PaymentChannelCreate');
    });

    it('Should return right parsed values', () => {
        const { tx, meta } = paymentChannelCreateTemplate;
        const instance = new PaymentChannelCreate(tx, meta);

        expect(instance.Type).toBe('PaymentChannelCreate');
        expect(instance.Account).toEqual({
            address: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
            tag: 11747,
        });
        expect(instance.Destination).toEqual({
            address: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
            tag: 23480,
        });
        expect(instance.SettleDelay).toBe(86400);
        expect(instance.PublicKey).toBe('32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A');
        expect(instance.Amount).toEqual({ currency: 'XRP', value: '0.01' });
        expect(instance.CancelAfter).toBe('2016-11-22T23:12:38.000Z');
    });
});
