/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

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
            const { tx, meta }: any = setRegularKeyTemplates;
            const instance = new SetRegularKey(tx, meta);

            expect(instance.RegularKey).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
        });
    });

    describe('Info', () => {
        const Mixed = MutationsMixin(SetRegularKey);
        const { tx, meta }: any = setRegularKeyTemplates;
        const setInstance = new Mixed(tx, meta);
        const clearInstance = new Mixed({ ...tx, RegularKey: '' }, meta);

        describe('generateDescription() && getEventsLabel()', () => {
            it('should return the expected description for setting the key', () => {
                const info = new SetRegularKeyInfo(setInstance, {} as any);

                const expectedDescription = `This is a SetRegularKey transaction${'\n'}It sets the account regular key to rrrrrrrrrrrrrrrrrrrrbzbvji`;

                expect(info.getEventsLabel()).toEqual(Localize.t('events.setRegularKey'));
                expect(info.generateDescription()).toEqual(expectedDescription);
            });

            it('should return the expected description for removing the key', () => {
                const info = new SetRegularKeyInfo(clearInstance, {} as any);

                const expectedDescription = `This is a SetRegularKey transaction${'\n'}It removes the account regular key`;

                expect(info.getEventsLabel()).toEqual(Localize.t('events.removeRegularKey'));
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants for setting the key', () => {
                const info = new SetRegularKeyInfo(setInstance, {} as any);
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrbzbvji', tag: undefined },
                });
            });

            it('should return the expected participants for removing the key', () => {
                const info = new SetRegularKeyInfo(clearInstance, {} as any);
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                    end: undefined,
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                const info = new SetRegularKeyInfo(setInstance, {} as any);
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
