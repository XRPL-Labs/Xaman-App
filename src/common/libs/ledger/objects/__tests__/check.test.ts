/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { Check, CheckInfo } from '../Check';

import checkObjectTemplate from './fixtures/CheckObject.json';

jest.mock('@services/LedgerService');
jest.mock('@services/NetworkService');

describe('Check object', () => {
    describe('Class', () => {
        it('Should return right parsed values', () => {
            const object: any = checkObjectTemplate;
            const instance = new Check(object);

            expect(instance.Type).toBe('Check');
            expect(instance.LedgerEntryType).toBe('Check');
            expect(instance.Account).toBe('rrrrrrrrrrrrrrrrrrrrBZbvji');
            expect(instance.SendMax).toStrictEqual({
                currency: 'XRP',
                value: '100',
            });
            expect(instance.Expiration).toBe('2018-01-24T12:52:01.000Z');
            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrn5RM1rHd');
            expect(instance.DestinationTag).toEqual(1);
            expect(instance.InvoiceID).toBe('46060241FABCF692D4D934BA2A6C4427CD4279083E38C77CBE642243E43BE291');
        });
    });

    describe('Info', () => {
        const object: any = checkObjectTemplate;
        const instance = new Check(object);
        const info = new CheckInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The check is from rrrrrrrrrrrrrrrrrrrrBZbvji to rrrrrrrrrrrrrrrrrrrn5RM1rHd${'\n'}The Check has a Source Tag: 1337${'\n'}The check has a destination Tag: 1${'\n'}Maximum amount of source currency the Check is allowed to debit the sender is 100 XRP`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('global.check'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrBZbvji', tag: 1337 },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrn5RM1rHd', tag: 1 },
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
                            value: '100',
                        },
                    ],
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                });
            });
        });
    });
});
