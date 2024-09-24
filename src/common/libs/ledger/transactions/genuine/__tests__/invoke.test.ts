/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { Invoke, InvokeInfo } from '../Invoke';
import invokeTemplate from './fixtures/InvokeTx.json';

jest.mock('@services/NetworkService');

describe('Invoke', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new Invoke();
            expect(instance.TransactionType).toBe('Invoke');
            expect(instance.Type).toBe('Invoke');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = invokeTemplate;
            const instance = new Invoke(tx, meta);

            expect(instance.Blob).toBe('0388935426E0D08083314842EDFBB2D517BD47699F9A4527318A8E10468C97C052');
            expect(instance.Destination).toEqual('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.InvoiceID).toBe('92FA6A9FC8EA6018D5D16532D7795C91BFB0831355BDFDA177E86C8BF997985F');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = invokeTemplate;
        const Mixed = MutationsMixin(Invoke);
        const instance = new Mixed(tx, meta);
        const info = new InvokeInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The initiator of this transaction is rrrrrrrrrrrrrrrrrrrrrholvtp${'\n'}The transaction Destination address is: rrrrrrrrrrrrrrrrrrrrbzbvji${'\n'}The transaction invoice ID is: 92FA6A9FC8EA6018D5D16532D7795C91BFB0831355BDFDA177E86C8BF997985F`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });
        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.invoke'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrbzbvji', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                // TODO: check me
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
