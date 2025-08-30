/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { CredentialCreate, CredentialCreateInfo } from '../CredentialCreate';
import credentialCreateTemplate from './fixtures/CredentialCreateTx.json';

jest.mock('@services/NetworkService');

describe('CredentialCreate tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new CredentialCreate();
            expect(instance.TransactionType).toBe('CredentialCreate');
            expect(instance.Type).toBe('CredentialCreate');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = credentialCreateTemplate;
            const instance = new CredentialCreate(tx, meta);

            expect(instance.Subject).toBe('rH6PVvtAawMNGyxpLvEAkUjpqZNZ1gNT3Z');
            expect(instance.CredentialType).toBe('4B5943');
            expect(instance.Expiration).toBe('2028-03-03T09:46:39.000Z');
            expect(instance.URI).toBe('69736162656C2E636F6D2F63726564656E7469616C732F6B79632F616C696365');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = credentialCreateTemplate;
        const Mixed = MutationsMixin(CredentialCreate);
        const instance = new Mixed(tx, meta);
        const info = new CredentialCreateInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an CredentialCreate transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.credentialCreate'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rsYxnKtb8JBzfG4hp6sVF3WiVNw2broUFo', tag: undefined },
                    end: { address: 'rH6PVvtAawMNGyxpLvEAkUjpqZNZ1gNT3Z', tag: undefined },
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
