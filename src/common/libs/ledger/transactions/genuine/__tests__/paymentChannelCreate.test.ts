/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin, SignMixin } from '@common/libs/ledger/mixin';

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
            const { tx, meta }: any = paymentChannelCreateTemplate;
            const instance = new PaymentChannelCreate(tx, meta);

            expect(instance.Account).toEqual('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.SourceTag).toEqual(11747);

            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.DestinationTag).toEqual(23480);

            expect(instance.SettleDelay).toBe(86400);
            expect(instance.PublicKey).toBe('32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A');
            expect(instance.Amount).toEqual({ currency: 'XRP', value: '0.01' });
            expect(instance.CancelAfter).toBe('2016-11-22T23:12:38.000Z');
        });

        it('Should populate public key if not set', async () => {
            const { tx, meta }: any = paymentChannelCreateTemplate;
            delete tx.PublicKey;

            const Mixed = SignMixin(PaymentChannelCreate);
            const instance = new Mixed(tx, meta);

            expect(instance.PublicKey).toBe(undefined);

            await instance.prepare({
                publicKey: '32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A',
            } as any);

            expect(instance.PublicKey).toBe('32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = paymentChannelCreateTemplate;
        const Mixed = MutationsMixin(PaymentChannelCreate);
        const instance = new Mixed(tx, meta);
        const info = new PaymentChannelCreateInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The account rrrrrrrrrrrrrrrrrrrrrholvtp will create a payment channel to rrrrrrrrrrrrrrrrrrrrbzbvji${'\n'}The channel ID is 5DB01B7FFED6B67E6B0414DED11E051D2EE2B7619CE0EAA6286D67A3A4D5BDB3${'\n'}The channel amount is 0.01 XRP${'\n'}Source Tag: 11747${'\n'}Destination Tag: 23480${'\n'}The channel has a settlement delay of 86400 seconds${'\n'}It can be cancelled after Wednesday, November 23, 2016 12:12 AM`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createPaymentChannel'));
            });
        });
    });

    describe('Validation', () => {});
});
