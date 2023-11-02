/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

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
            const { tx, meta } = invokeTemplate;
            const instance = new Invoke(tx, meta);

            expect(instance.Blob).toBe('0388935426E0D08083314842EDFBB2D517BD47699F9A4527318A8E10468C97C052');
            expect(instance.Destination).toStrictEqual({
                address: 'rrrrrrrrrrrrrrrrrrrrbzbvji',
                tag: 1337,
            });
            expect(instance.InvoiceID).toBe('92FA6A9FC8EA6018D5D16532D7795C91BFB0831355BDFDA177E86C8BF997985F');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = invokeTemplate;
                const instance = new Invoke(tx, meta);

                // TODO: add description tests
                // const expectedDescription = Localize.t('events.itAuthorizesSendingPaymentsToThisAccount', {
                //     address: tx.Authorize,
                // });
                //
                // expect(EscrowCancelInfo.getDescription(instance)).toEqual(expectedDescription);

                expect(instance).toBeDefined();
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(InvokeInfo.getLabel()).toEqual(Localize.t('events.invoke'));
            });
        });
    });

    describe('Validation', () => {});
});
