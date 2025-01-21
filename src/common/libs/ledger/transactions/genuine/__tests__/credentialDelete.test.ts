/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { CredentialDelete, CredentialDeleteInfo } from '../CredentialDelete';
import credentialCreateTemplate from './fixtures/CredentialDeleteTx.json';

jest.mock('@services/NetworkService');

describe('CredentialDelete tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new CredentialDelete();
            expect(instance.TransactionType).toBe('CredentialDelete');
            expect(instance.Type).toBe('CredentialDelete');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = credentialCreateTemplate;
            const instance = new CredentialDelete(tx, meta);

            expect(instance.Issuer).toBe('rsYxnKtb8JBzfG4hp6sVF3WiVNw2broUFo');
            expect(instance.CredentialType).toBe('4B5943');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = credentialCreateTemplate;
        const Mixed = MutationsMixin(CredentialDelete);
        const instance = new Mixed(tx, meta);
        const info = new CredentialDeleteInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an CredentialDelete transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.credentialDelete'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rH6PVvtAawMNGyxpLvEAkUjpqZNZ1gNT3Z', tag: undefined },
                    end: { address: 'rsYxnKtb8JBzfG4hp6sVF3WiVNw2broUFo', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
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
