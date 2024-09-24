/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

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
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = setHookTemplate.Create;
                const instance = new SetHook(tx, meta);

                const expectedDescription = `This is an ${instance.Type} transaction`;

                expect(SetHookInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(SetHookInfo.getLabel()).toEqual(Localize.t('events.setHooks'));
            });
        });
    });

    describe('Validation', () => {});
});
