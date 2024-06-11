/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { DIDSet, DIDSetInfo } from '../DIDSet';
import didSetTemplate from './fixtures/DIDSetTx.json';

jest.mock('@services/NetworkService');

describe('DIDSet tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new DIDSet();
            expect(instance.TransactionType).toBe('DIDSet');
            expect(instance.Type).toBe('DIDSet');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = didSetTemplate;
            const instance = new DIDSet(tx, meta);

            expect(instance.Data).toBe('6479727A74357');
            expect(instance.DIDDocument).toBe('6266336F6');
            expect(instance.URI).toBe(
                '697066733A2F2F62616679626569676479727A74357366703775646D37687537367568377932366E6634646675796C71616266336F636C67747179353566627A6469',
            );
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = didSetTemplate;
        const Mixed = MutationsMixin(DIDSet);
        const instance = new Mixed(tx, meta);
        const info = new DIDSetInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an DIDSet transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.didSet'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
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
