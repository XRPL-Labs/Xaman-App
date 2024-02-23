/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { SetHook, SetHookInfo } from '../SetHook';
import setHookTemplate from './fixtures/SetHookTx.json';

jest.mock('@services/NetworkService');

describe('SetHook tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new SetHook();
            expect(instance.TransactionType).toBe('SetHook');
            expect(instance.Type).toBe('SetHook');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = setHookTemplate.Create;
            const instance = new SetHook(tx, meta);

            expect(instance.Hooks?.length).toBeGreaterThan(0);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = setHookTemplate.Create;
        const Mixed = MutationsMixin(SetHook);
        const instance = new Mixed(tx, meta);
        const info = new SetHookInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${instance.Type} transaction`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.setHooks'));
            });
        });
    });

    describe('Validation', () => {});
});
