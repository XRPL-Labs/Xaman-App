/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { SignerListSet, SignerListSetInfo } from '../SignerListSet';
import signerListSetTemplates from './fixtures/SignerListSetTx.json';

jest.mock('@services/NetworkService');

describe('SignerListSet tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new SignerListSet();
            expect(instance.TransactionType).toBe('SignerListSet');
            expect(instance.Type).toBe('SignerListSet');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = signerListSetTemplates;
            const instance = new SignerListSet(tx, meta);

            expect(instance.SignerQuorum).toBe(3);

            expect(instance.SignerEntries).toStrictEqual([
                {
                    Account: 'rK8MWkYVgHR6VmPH6WpWcvVce9evvMpKSv',
                    SignerWeight: 2,
                },
                {
                    Account: 'rLoRH7XuBgz2kTP1ACkoyVYk9hsLggVvbP',
                    SignerWeight: 1,
                },
                {
                    Account: 'rL6SsrxyVp1JLNEZsX1hFWHcP2iJcZJ2dy',
                    SignerWeight: 1,
                },
            ]);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = signerListSetTemplates;
        const Mixed = MutationsMixin(SignerListSet);
        const instance = new Mixed(tx, meta);
        const info = new SignerListSetInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${instance.Type} transaction`;

                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.setSignerList'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'radE4Xd2RpQTBAx6YkpWbb7Z3fkcAgsHpK', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        sent: undefined,
                        received: undefined,
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
