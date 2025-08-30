/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { CredentialAccept, CredentialAcceptInfo } from '../CredentialAccept';
import credentialCreateTemplate from './fixtures/CredentialAcceptTx.json';

jest.mock('@services/NetworkService');

describe('CredentialAccept tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new CredentialAccept();
            expect(instance.TransactionType).toBe('CredentialAccept');
            expect(instance.Type).toBe('CredentialAccept');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = credentialCreateTemplate;
            const instance = new CredentialAccept(tx, meta);

            expect(instance.Issuer).toBe('rsYxnKtb8JBzfG4hp6sVF3WiVNw2broUFo');
            expect(instance.CredentialType).toBe('4B5943');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = credentialCreateTemplate;
        const Mixed = MutationsMixin(CredentialAccept);
        const instance = new Mixed(tx, meta);
        const info = new CredentialAcceptInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an CredentialAccept transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.credentialAccept'));
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
