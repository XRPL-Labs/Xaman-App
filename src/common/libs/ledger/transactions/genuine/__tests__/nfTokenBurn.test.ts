/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { NFTokenBurn, NFTokenBurnInfo } from '../NFTokenBurn';
import nFTokenBurnTemplate from './fixtures/NFTokenBurnTx.json';

jest.mock('@services/NetworkService');

describe('NFTokenBurn tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new NFTokenBurn();
            expect(instance.TransactionType).toBe('NFTokenBurn');
            expect(instance.Type).toBe('NFTokenBurn');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = nFTokenBurnTemplate;
            const instance = new NFTokenBurn(tx, meta);

            expect(instance.NFTokenID).toBe('000B013A95F14B0044F78A264E41713C64B5F89242540EE208C3098E00000D65');
            expect(instance.Owner).toBe('rrrrrrrrrrrrrrrrrrrrbzbvji');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = nFTokenBurnTemplate;
        const MixedNFTokenBurn = MutationsMixin(NFTokenBurn);
        const instance = new MixedNFTokenBurn(tx, meta);
        const info = new NFTokenBurnInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription =
                    'The transaction will burn NFT token with ID 000B013A95F14B0044F78A264E41713C64B5F89242540EE208C3098E00000D65';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.burnNFT'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
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
