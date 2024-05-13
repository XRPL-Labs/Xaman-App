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

            expect(instance.Account).toEqual('rJnQrhRTXutuSwtrwxYiTkHn4Dtp8sF2LM');
            expect(instance.SourceTag).toEqual(2460331042);

            expect(instance.Destination).toEqual('rUXYat4hW2M87gHoqKK7fC4cqrT9C6V7d7');
            expect(instance.DestinationTag).toEqual(1337);

            expect(instance.SettleDelay).toBe(3600);
            expect(instance.PublicKey).toBe('EDA77EDD1D4BC31E7D104D345A0E74508CC66285E9263E8D229F6FC51E70078BA0');
            expect(instance.Amount).toEqual({ currency: 'XRP', value: '1' });
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
                const expectedDescription = `The account rJnQrhRTXutuSwtrwxYiTkHn4Dtp8sF2LM will create a payment channel to rUXYat4hW2M87gHoqKK7fC4cqrT9C6V7d7${'\n'}The channel ID is 15AB9EE9344C42C05164E6A1F2F08B35F35D7B9D66CCB9697452B0995C8F8242${'\n'}The channel amount is 1 XRP${'\n'}Source Tag: 2460331042${'\n'}Destination Tag: 1337${'\n'}The channel has a settlement delay of 3600 seconds${'\n'}It can be cancelled after Wednesday, November 23, 2016 12:12 AM`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.createPaymentChannel'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rJnQrhRTXutuSwtrwxYiTkHn4Dtp8sF2LM', tag: 2460331042 },
                    end: { address: 'rUXYat4hW2M87gHoqKK7fC4cqrT9C6V7d7', tag: 1337 },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            currency: 'XRP',
                            effect: 'IMMEDIATE_EFFECT',
                            value: '1',
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
