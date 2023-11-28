/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { PaymentChannelFund, PaymentChannelFundInfo } from '../PaymentChannelFund';
import paymentChannelFundTemplates from './fixtures/PaymentChannelFundTx.json';

jest.mock('@services/NetworkService');

describe('PaymentChannelFund tx', () => {
    describe('Class', () => {
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

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = paymentChannelFundTemplates;
                const instance = new PaymentChannelFund(tx, meta);

                const expectedDescription = `${Localize.t('events.itWillUpdateThePaymentChannel', {
                    channel: instance.Channel,
                })}\n${Localize.t('events.itWillIncreaseTheChannelAmount', {
                    amount: instance.Amount.value,
                    currency: instance.Amount.currency,
                })}`;

                expect(PaymentChannelFundInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(PaymentChannelFundInfo.getLabel()).toEqual(Localize.t('events.fundPaymentChannel'));
            });
        });
    });

    describe('Validation', () => {});
});
