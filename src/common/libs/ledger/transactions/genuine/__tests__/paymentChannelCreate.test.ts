/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import moment from 'moment-timezone';

import Localize from '@locale';

import { PaymentChannelCreate, PaymentChannelCreateInfo } from '../PaymentChannelCreate';
import paymentChannelCreateTemplate from './fixtures/PaymentChannelCreateTx.json';

jest.mock('@services/NetworkService');

describe('PaymentChannelCreate tx', () => {
    describe('Class', () => {
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

        it('Should populate public key if not set', async () => {
            const { tx, meta } = paymentChannelCreateTemplate;
            delete tx.PublicKey;
            const instance = new PaymentChannelCreate(tx, meta);

            expect(instance.PublicKey).toBe(undefined);

            await instance.prepare({
                publicKey: '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A',
            } as any);

            expect(instance.PublicKey).toBe('32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = paymentChannelCreateTemplate;
                const instance = new PaymentChannelCreate(tx, meta);

                const expectedDescription = `${Localize.t('events.accountWillCreateAPaymentChannelTo', {
                    account: instance.Account.address,
                    destination: instance.Destination.address,
                })}\n${Localize.t('events.theChannelIdIs', {
                    channel: instance.ChannelID,
                })}\n${Localize.t('events.theChannelAmountIs', {
                    amount: instance.Amount.value,
                    currency: instance.Amount.currency,
                })}\n${Localize.t('events.theASourceTagIs', { tag: instance.Account.tag })} \n${Localize.t(
                    'events.theDestinationTagIs',
                    { tag: instance.Destination.tag },
                )} \n${Localize.t('events.theChannelHasASettlementDelay', { delay: tx.SettleDelay })} \n${Localize.t(
                    'events.itCanBeCancelledAfter',
                    { cancelAfter: moment(instance.CancelAfter).format('LLLL') },
                )}`;

                expect(PaymentChannelCreateInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(PaymentChannelCreateInfo.getLabel()).toEqual(Localize.t('events.createPaymentChannel'));
            });
        });
    });

    describe('Validation', () => {});
});
