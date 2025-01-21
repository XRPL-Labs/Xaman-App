/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { DepositPreauth, DepositPreauthInfo } from '../DepositPreauth';
import depositPreauthTemplate from './fixtures/DepositPreauthTx.json';

jest.mock('@services/NetworkService');

describe('DepositPreauth', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new DepositPreauth();
            expect(instance.TransactionType).toBe('DepositPreauth');
            expect(instance.Type).toBe('DepositPreauth');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = depositPreauthTemplate;
            const instance = new DepositPreauth(tx, meta);

            expect(instance.Authorize).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.Unauthorize).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.AuthorizeCredentials).toMatchObject([
                {
                    Issuer: 'rrrrrrrrrrrrrrrrrrrrbzbvji',
                    CredentialType: '4B5943',
                },
            ]);
            expect(instance.UnauthorizeCredentials).toMatchObject([
                {
                    Issuer: 'rrrrrrrrrrrrrrrrrrrrbzbvji',
                    CredentialType: '4B5943',
                },
            ]);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = depositPreauthTemplate;
        const MixedDepositPreauth = MutationsMixin(DepositPreauth);
        const instanceAuthorize = new MixedDepositPreauth(
            { ...tx, ...{ Unauthorize: undefined, UnauthorizeCredentials: undefined } },
            meta,
        );
        const instanceUnauthorize = new MixedDepositPreauth(
            { ...tx, ...{ Authorize: undefined, AuthorizeCredentials: undefined } },
            meta,
        );

        describe('generateDescription()', () => {
            it('should return the expected description Authorize', () => {
                const info = new DepositPreauthInfo(instanceAuthorize, {} as any);
                const expectedDescription =
                    'It authorizes rrrrrrrrrrrrrrrrrrrrbzbvji to send payments to this account\nIt authorizes credential(s)\nrrrrrrrrrrrrrrrrrrrrbzbvji:4B5943';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected description for Unauthorize', () => {
                const info = new DepositPreauthInfo(instanceUnauthorize, {} as any);
                const expectedDescription =
                    'It removes the authorization for rrrrrrrrrrrrrrrrrrrrbzbvji to send payments to this account\nIt un-authorizes credential(s)\nrrrrrrrrrrrrrrrrrrrrbzbvji:4B5943';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label for Authorize', () => {
                const info = new DepositPreauthInfo(instanceAuthorize, {} as any);
                expect(info.getEventsLabel()).toEqual(Localize.t('events.authorizeDeposit'));
            });
            it('should return the expected label for Unauthorize', () => {
                const info = new DepositPreauthInfo(instanceUnauthorize, {} as any);
                expect(info.getEventsLabel()).toEqual(Localize.t('events.unauthorizeDeposit'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                const info = new DepositPreauthInfo(instanceAuthorize, {} as any);
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrbzbvji', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                const info = new DepositPreauthInfo(instanceAuthorize, {} as any);
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
