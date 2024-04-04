/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { AMMWithdraw, AMMWithdrawInfo } from '../AMMWithdraw';
import ammWithdrawTemplate from './fixtures/AMMWithdrawTx.json';

jest.mock('@services/NetworkService');

const MixedAMMWithdraw = MutationsMixin(AMMWithdraw);

describe('AMMWithdraw tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AMMWithdraw();
            expect(instance.TransactionType).toBe('AMMWithdraw');
            expect(instance.Type).toBe('AMMWithdraw');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = ammWithdrawTemplate;
            const instance = new AMMWithdraw(tx, meta);

            expect(instance.Asset).toStrictEqual({ currency: 'XRP' });
            expect(instance.Asset2).toStrictEqual({ currency: 'USD', issuer: 'rhpHaFggC92ELty3n3yDEtuFgWxXWkUFET' });
            expect(instance.Amount).toStrictEqual({
                currency: 'USD',
                issuer: 'rhpHaFggC92ELty3n3yDEtuFgWxXWkUFET',
                value: '4000',
            });
            expect(instance.Amount2).toStrictEqual({
                currency: 'XRP',
                value: '4000',
            });
            expect(instance.LPTokenIn).toStrictEqual({
                currency: 'B3813FCAB4EE68B3D0D735D6849465A9113EE048',
                issuer: 'rH438jEAzTs5PYtV6CHZqpDpwCKQmPW9Cg',
                value: '1000',
            });
            expect(instance.EPrice).toStrictEqual({ currency: 'XRP', value: '0.000025' });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = ammWithdrawTemplate;
        const instance = new MixedAMMWithdraw(tx, meta);
        const info = new AMMWithdrawInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${instance.Type} transaction`;

                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.ammWithdraw'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: {
                        address: 'rUwaiErsYE5kibUUtaPczXZVVd73VNy4R9',
                        tag: undefined,
                    },
                    end: {
                        address: 'rMEdVzU8mtEArzjrN9avm3kA675GX7ez8W',
                        tag: undefined,
                    },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        sent: {
                            action: 0,
                            currency: '03930D02208264E2E40EC1B0C09E4DB96EE197B1',
                            issuer: 'rMEdVzU8mtEArzjrN9avm3kA675GX7ez8W',
                            value: '3829663.63131411',
                        },
                        received: {
                            action: 1,
                            currency: 'XRP',
                            value: '3666.580872',
                        },
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
