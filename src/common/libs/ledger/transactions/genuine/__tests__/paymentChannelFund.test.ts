/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

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
            const { tx, meta }: any = paymentChannelFundTemplates;
            const instance = new PaymentChannelFund(tx, meta);

            expect(instance.Account).toEqual('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.Type).toBe('PaymentChannelFund');
            expect(instance.Channel).toBe('C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198');
            expect(instance.Amount).toEqual({ currency: 'XRP', value: '0.2' });
            expect(instance.Expiration).toBe('2017-03-18T16:59:18.000Z');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = paymentChannelFundTemplates;
        const Mixed = MutationsMixin(PaymentChannelFund);
        const instance = new Mixed(tx, meta);
        const info = new PaymentChannelFundInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `It will update the payment channel C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198${'\n'}It will increase the channel amount by 0.2 XRP`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.fundPaymentChannel'));
            });
        });
    });

    describe('Validation', () => {});
});
