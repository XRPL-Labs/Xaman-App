/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { SetRegularKey, SetRegularKeyInfo } from '../SetRegularKey';
import setRegularKeyTemplates from './fixtures/SetRegularKeyTx.json';

jest.mock('@services/NetworkService');

describe('SetRegularKey tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new SetRegularKey();
            expect(instance.TransactionType).toBe('SetRegularKey');
            expect(instance.Type).toBe('SetRegularKey');
        });

        it('Should return right parsed values', () => {
            // @ts-ignore
            const { tx, meta } = setRegularKeyTemplates;
            const instance = new SetRegularKey(tx, meta);

            expect(instance.RegularKey).toBe('rDestinationxxxxxxxxxxxxxxxxxxxxxx');
        });
    });

    describe('Info', () => {
        describe('getDescription() && getLabel()', () => {
            it('should return the expected description for setting the key', () => {
                const { tx, meta } = setRegularKeyTemplates;
                const instance = new SetRegularKey(tx, meta);

                const expectedDescription = `${Localize.t('events.thisIsAnSetRegularKeyTransaction')}\n${Localize.t(
                    'events.itSetsAccountRegularKeyTo',
                    { regularKey: tx.RegularKey },
                )}`;

                expect(SetRegularKeyInfo.getLabel(instance)).toEqual(Localize.t('events.setRegularKey'));
                expect(SetRegularKeyInfo.getDescription(instance)).toEqual(expectedDescription);
            });

            it('should return the expected description for removing the key', () => {
                const { tx, meta } = setRegularKeyTemplates;
                const instance = new SetRegularKey({ ...tx, RegularKey: '' }, meta);

                const expectedDescription = `${Localize.t('events.thisIsAnSetRegularKeyTransaction')}\n${Localize.t(
                    'events.itRemovesTheAccountRegularKey',
                )}`;

                expect(SetRegularKeyInfo.getLabel(instance)).toEqual(Localize.t('events.removeRegularKey'));
                expect(SetRegularKeyInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });
    });

    describe('Validation', () => {});
});
