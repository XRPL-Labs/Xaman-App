/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { EnableAmendment, EnableAmendmentInfo } from '../EnableAmendment';
import enableAmendmentTemplate from './fixtures/EnableAmendmentTx.json';
import { MutationsMixin } from '../../../mixin';

jest.mock('@services/NetworkService');

describe('EnableAmendment', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new EnableAmendment();
            expect(instance.TransactionType).toBe('EnableAmendment');
            expect(instance.Type).toBe('EnableAmendment');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = enableAmendmentTemplate;
        const MixedEnableAmendment = MutationsMixin(EnableAmendment);
        const instanceEnableAmendment = new MixedEnableAmendment(tx, meta);
        const info = new EnableAmendmentInfo(instanceEnableAmendment, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description Authorize', () => {
                const expectedDescription = 'This is an EnableAmendment transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label for Authorize', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.enableAmendment'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrhoLvTp', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: undefined,
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
