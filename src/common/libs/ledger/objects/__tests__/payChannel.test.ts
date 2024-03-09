/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { PayChannel, PayChannelInfo } from '../PayChannel';
import payChannelObjectTemplate from './fixtures/PayChannel.json';

jest.mock('@services/NetworkService');

describe('PayChannel object', () => {
    describe('Class', () => {
        it('Should return right parsed values', () => {
            const object: any = payChannelObjectTemplate;
            const instance = new PayChannel(object);

            expect(instance.Type).toBe('PayChannel');
            expect(instance.LedgerEntryType).toBe('PayChannel');
            expect(instance.Account).toEqual('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.SourceTag).toEqual(0);

            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.DestinationTag).toEqual(1002341);

            expect(instance.SettleDelay).toBe(3600);
            expect(instance.PublicKey).toBe('32D2471DB72B27E3310F355BB33E339BF26F8392D5A93D3BC0FC3B566612DA0F0A');
            expect(instance.Amount).toEqual({ currency: 'XRP', value: '4.3258' });
            expect(instance.Balance).toEqual({ currency: 'XRP', value: '2.323423' });
            expect(instance.CancelAfter).toBe('2017-01-05T00:28:33.000Z');
        });
    });

    describe('Info', () => {
        const object: any = payChannelObjectTemplate;
        const instance = new PayChannel(object);
        const info = new PayChannelInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The account rrrrrrrrrrrrrrrrrrrrrholvtp created a payment channel to rrrrrrrrrrrrrrrrrrrrbzbvji${'\n'}The channel ID is 96F76F27D8A327FC48753167EC04A46AA0E382E6F57F32FD12274144D00F1797${'\n'}The channel amount is 4.3258 XRP${'\n'}Source Tag: 0${'\n'}Destination Tag: 1002341${'\n'}The channel expires at 2016-12-26T00:28:33.000Z.${'\n'}The channel has a settlement delay of 3600 seconds${'\n'}It can be cancelled after Thursday, January 5, 2017 1:28 AM`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.paymentChannel'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: 0 },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrbzbvji', tag: 1002341 },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: undefined,
                    factor: { currency: 'XRP', value: '4.3258', effect: 0 },
                });
            });
        });
    });

    describe('Validation', () => {});
});
