/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { NFTokenMint, NFTokenMintInfo } from '../NFTokenMint';
import nfTokenMintTemplate from './fixtures/NFTokenMintTx.json';

jest.mock('@services/NetworkService');

describe('NFTokenMint tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new NFTokenMint();
            expect(instance.TransactionType).toBe('NFTokenMint');
            expect(instance.Type).toBe('NFTokenMint');
        });

        it('Should return right values', () => {
            const { tx, meta }: any = nfTokenMintTemplate;
            const instance = new NFTokenMint(tx, meta);

            expect(instance.NFTokenTaxon).toEqual(48);
            expect(instance.Issuer).toEqual('ra5jrnrq9BxsvzGeJY5XS9inftcJWMdJUx');
            expect(instance.TransferFee).toEqual(5);
            expect(instance.URI).toEqual(
                '697066733A2F2F62616679626569646272676F706B373763657764723771666B6F62736A71356D70367A706A68333736623474627235343268726C627561637266712F6D657461646174612E6A736F6E',
            );
            expect(instance.Amount).toStrictEqual({
                value: '1',
                currency: 'XRP',
            });
            expect(instance.Destination).toBe('rH6PVvtAawMNGyxpLvEAkUjpqZNZ1gNT3');
            expect(instance.Expiration).toBe('2030-09-28T03:58:41.000Z');
        });

        it('Should return right NFTokenID from meta data', () => {
            const { tx, meta }: any = nfTokenMintTemplate;
            const instance = new NFTokenMint(tx, meta);
            expect(instance.NFTokenID).toEqual(meta.nftoken_id);
        });

        it('Should calculate right NFTokenID', () => {
            const { tx, meta }: any = nfTokenMintTemplate;
            const { nftoken_id } = meta;
            const instance = new NFTokenMint(tx, { ...meta, nftoken_id: undefined });
            expect(instance.NFTokenID).toEqual(nftoken_id);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = nfTokenMintTemplate;
        const Mixed = MutationsMixin(NFTokenMint);
        const instance = new Mixed(tx, meta);
        const info = new NFTokenMintInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The Token ID is 000813883EBCBE82C32E1CA28616DBDD2E40873D446B0EC505C73BA9047ED3FE${'\n'}The token has a transfer fee: 5%${'\n'}The Taxon for this token is 48${'\n'}rXMART8usFd5kABXCayoP6ZfB35b4v43t offered to sell NFT token with ID 000813883EBCBE82C32E1CA28616DBDD2E40873D446B0EC505C73BA9047ED3FE in order to receive 1 XRP${'\n'}This offer may only be accepted by rH6PVvtAawMNGyxpLvEAkUjpqZNZ1gNT3${'\n'}The offer expires at Saturday, September 28, 2030 5:58 AM unless it is canceled or accepted before then.`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.mintNFT'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rXMART8usFd5kABXCayoP6ZfB35b4v43t', tag: undefined },
                    through: { address: 'ra5jrnrq9BxsvzGeJY5XS9inftcJWMdJUx', tag: undefined },
                    end: { address: 'rH6PVvtAawMNGyxpLvEAkUjpqZNZ1gNT3', tag: undefined },
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
                    factor: [
                        {
                            action: 'INC',
                            currency: 'XRP',
                            effect: 'POTENTIAL_EFFECT',
                            value: '1',
                        },
                    ],
                });
            });
        });
    });

    describe('Validation', () => {});
});
