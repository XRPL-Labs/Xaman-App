/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { AMMDeposit, AMMDepositInfo } from '../AMMDeposit';
import ammDepositTemplate from './fixtures/AMMDepositTx.json';

jest.mock('@services/NetworkService');

describe('AMMDeposit tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AMMDeposit();
            expect(instance.TransactionType).toBe('AMMDeposit');
            expect(instance.Type).toBe('AMMDeposit');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = ammDepositTemplate;
            const instance = new AMMDeposit(tx, meta);

            expect(instance.Asset).toStrictEqual({ currency: 'XRP' });
            expect(instance.Asset2).toStrictEqual({ currency: 'ETH', issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9' });
            expect(instance.Amount).toStrictEqual({ currency: 'XRP', value: '0.001' });
            expect(instance.Amount2).toStrictEqual({
                currency: 'ETH',
                issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
                value: '500',
            });
            expect(instance.LPTokenOut).toStrictEqual({
                currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
                issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
                value: '1000',
            });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = ammDepositTemplate;
        const Mixed = MutationsMixin(AMMDeposit);
        const instance = new Mixed(tx, meta);
        const info = new AMMDepositInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${instance.Type} transaction`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.ammDeposit'));
            });
        });
    });

    describe('Validation', () => {});
});
