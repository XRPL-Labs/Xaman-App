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
                currency: 'XRP',
                value: '10000',
            });
            expect(instance.Amount2).toStrictEqual({
                currency: 'USD',
                issuer: 'rhpHaFggC92ELty3n3yDEtuFgWxXWkUFET',
                value: '10000',
            });
            expect(instance.TradingFee).toBe(0.001);
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

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rwRGF9pmfEGT4GcZ379cYC9p3wpJDozy8w', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        sent: {
                            action: 0,
                            currency: 'USD',
                            issuer: 'rhpHaFggC92ELty3n3yDEtuFgWxXWkUFET',
                            value: '10000',
                        },
                        received: {
                            action: 1,
                            currency: '03930D02208264E2E40EC1B0C09E4DB96EE197B1',
                            issuer: 'rMEdVzU8mtEArzjrN9avm3kA675GX7ez8W',
                            value: '10000000',
                        },
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
