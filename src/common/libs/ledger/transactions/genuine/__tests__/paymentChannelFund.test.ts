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

            expect(instance.Account).toEqual('rK6g2UYc4GpQH8DYdPG7wywyQbxkJpQTTN');
            expect(instance.Type).toBe('PaymentChannelFund');
            expect(instance.Channel).toBe('C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198');
            expect(instance.Amount).toEqual({ currency: 'XRP', value: '1' });
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
                const expectedDescription = `It will update the payment channel C1AE6DDDEEC05CF2978C0BAD6FE302948E9533691DC749DCDD3B9E5992CA6198${'\n'}It will increase the channel amount by 1 XRP`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.fundPaymentChannel'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rK6g2UYc4GpQH8DYdPG7wywyQbxkJpQTTN', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            currency: 'XRP',
                            effect: 'POTENTIAL_EFFECT',
                            value: '1',
                            action: 'INC',
                        },
                    ],
                    mutate: {
                        DEC: [
                            {
                                action: 'DEC',
                                currency: 'XRP',
                                value: '1',
                            },
                        ],
                        INC: [],
                    },
                });
            });
        });
    });

    describe('Validation', () => {});
});
