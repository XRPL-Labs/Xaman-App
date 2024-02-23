/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { AMMDelete, AMMDeleteInfo } from '../AMMDelete';
import ammDeleteTemplate from './fixtures/AMMDeleteTx.json';

jest.mock('@services/NetworkService');

describe('AMMDelete tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AMMDelete();
            expect(instance.TransactionType).toBe('AMMDelete');
            expect(instance.Type).toBe('AMMDelete');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = ammDeleteTemplate;
            const instance = new AMMDelete(tx, meta);

            expect(instance.Asset).toStrictEqual({
                currency: 'XRP',
            });
            expect(instance.Asset2).toStrictEqual({
                currency: 'TST',
                issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
            });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = ammDeleteTemplate;
        const Mixed = MutationsMixin(AMMDelete);
        const instance = new Mixed(tx, meta);
        const info = new AMMDeleteInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${instance.Type} transaction`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.ammDelete'));
            });
        });
    });

    describe('Validation', () => {});
});
