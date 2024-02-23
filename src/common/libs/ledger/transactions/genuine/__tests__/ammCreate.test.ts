/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { AMMCreate, AMMCreateInfo } from '../AMMCreate';
import ammCreateTemplate from './fixtures/AMMCreateTx.json';

jest.mock('@services/NetworkService');

const MixedAMMCreate = MutationsMixin(AMMCreate);

describe('AMMCreate tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new AMMCreate();
            expect(instance.TransactionType).toBe('AMMCreate');
            expect(instance.Type).toBe('AMMCreate');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = ammCreateTemplate;
            const instance = new AMMCreate(tx, meta);

            expect(instance.Amount).toStrictEqual({
                currency: 'TST',
                issuer: 'rP9jPyP5kyvFRb6ZiRghAGw5u8SGAmU4bd',
                value: '25',
            });
            expect(instance.Amount2).toStrictEqual({ currency: 'XRP', value: '250' });
            expect(instance.TradingFee).toBe(0.5);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = ammCreateTemplate;
        const instance = new MixedAMMCreate(tx, meta);
        const info = new AMMCreateInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an ${instance.Type} transaction`;

                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.ammCreate'));
            });
        });
    });

    describe('Validation', () => {});
});
