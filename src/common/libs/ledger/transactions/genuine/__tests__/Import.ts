/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { Import, ImportInfo } from '../Import';

import importTemplate from './fixtures/ImportTx.json';

jest.mock('@services/NetworkService');

describe('Import ', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new Import();
            expect(instance.TransactionType).toBe('Import');
            expect(instance.Type).toBe('Import');
        });

        it('Should return right parsed values', () => {
            const { tx, meta } = importTemplate.RegularKey;
            const instance = new Import(tx, meta);

            expect(instance.TransactionType).toBe('Import');
            expect(instance.Type).toBe('Import');

            expect(instance.Blob).toBe('dd');
            expect(instance.Issuer).toBe('rrrrrrrrrrrrrrrrrrrrrholvtp');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = importTemplate.RegularKey;
                const instance = new Import(tx, meta);

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
                expect(ImportInfo.getLabel()).toEqual(Localize.t('events.import'));
            });
        });
    });

    describe('Validation', () => {});
});
