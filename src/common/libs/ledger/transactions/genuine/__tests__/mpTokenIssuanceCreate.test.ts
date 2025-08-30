/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { MPTokenIssuanceCreate, MPTokenIssuanceCreateInfo } from '../MPTokenIssuanceCreate';
import mpTokenIssuanceCreateTemplate from './fixtures/MPTokenIssuanceCreateTx.json';

jest.mock('@services/NetworkService');

describe('MPTokenIssuanceCreate tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new MPTokenIssuanceCreate();
            expect(instance.TransactionType).toBe('MPTokenIssuanceCreate');
            expect(instance.Type).toBe('MPTokenIssuanceCreate');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = mpTokenIssuanceCreateTemplate;
            const instance = new MPTokenIssuanceCreate(tx, meta);

            expect(instance.MPTokenMetadata).toBe('714F206C865D334721B2F3388BEAF33AA91BC1D78C71941D10A2A653C873EDD3');
            expect(instance.MaximumAmount).toBe('1342177280');
            expect(instance.TransferFee).toBe(0.314);
            expect(instance.AssetScale).toBe(2);
            expect(instance.MPTokenIssuanceID).toBe('004FD5D21BFB1ECDCD89560CBB2BB21F94559F32820FAD04');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = mpTokenIssuanceCreateTemplate;
        const MixedMPTokenIssuanceCreate = MutationsMixin(MPTokenIssuanceCreate);
        const instance = new MixedMPTokenIssuanceCreate(tx, meta);
        const info = new MPTokenIssuanceCreateInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = 'This is an MPTokenIssuanceCreate transaction';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.mpTokenIssuanceCreate'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rsYxnKtb8JBzfG4hp6sVF3WiVNw2broUFo', tag: undefined },
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
