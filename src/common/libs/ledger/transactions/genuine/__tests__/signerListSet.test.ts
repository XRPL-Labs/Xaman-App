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
                    Account: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
                    WalletLocator: '03075F65D8353E3A5DA3193FF976BC17A2D0B9376BE7DA942349B6526E5A2BBF54',
                    SignerWeight: 2,
                },
                { Account: 'rUpy3eEg8rqjqfUoLeBnZkscbKbFsKXC3v', SignerWeight: 1 },
                { Account: 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n', SignerWeight: 1 },
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
    });

    describe('Validation', () => {});
});
