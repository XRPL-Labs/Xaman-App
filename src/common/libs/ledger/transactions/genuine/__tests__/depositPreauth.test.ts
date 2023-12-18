/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

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
            // @ts-ignore
            const { tx, meta } = depositPreauthTemplate;
            const instance = new DepositPreauth(tx, meta);

            expect(instance.Authorize).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
            expect(instance.Unauthorize).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description Authorize', () => {
                const { tx, meta } = depositPreauthTemplate;
                const instance = new DepositPreauth({ ...tx, ...{ Unauthorize: undefined } }, meta);

                const expectedDescription = Localize.t('events.itAuthorizesSendingPaymentsToThisAccount', {
                    address: tx.Authorize,
                });

                expect(DepositPreauthInfo.getDescription(instance)).toEqual(expectedDescription);
            });

            it('should return the expected description for Unauthorize', () => {
                const { tx, meta } = depositPreauthTemplate;
                const instance = new DepositPreauth({ ...tx, ...{ Authorize: undefined } }, meta);

                const expectedDescription = Localize.t('events.itRemovesAuthorizesSendingPaymentsToThisAccount', {
                    address: tx.Unauthorize,
                });

                expect(DepositPreauthInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label for Authorize', () => {
                const { tx, meta } = depositPreauthTemplate;
                const instance = new DepositPreauth({ ...tx, ...{ Unauthorize: undefined } }, meta);
                expect(DepositPreauthInfo.getLabel(instance)).toEqual(Localize.t('events.authorizeDeposit'));
            });

            it('should return the expected label for Unauthorize', () => {
                const { tx, meta } = depositPreauthTemplate;
                const instance = new DepositPreauth({ ...tx, ...{ Authorize: undefined } }, meta);
                expect(DepositPreauthInfo.getLabel(instance)).toEqual(Localize.t('events.unauthorizeDeposit'));
            });
        });
    });

    describe('Validation', () => {});
});
