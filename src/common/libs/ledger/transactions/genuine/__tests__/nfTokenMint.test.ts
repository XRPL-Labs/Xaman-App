/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

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

        it('Should return right NFTokenID from meta data', () => {
            const { tx, meta } = nfTokenMintTemplate;
            const instance = new NFTokenMint(tx, meta);
            expect(instance.NFTokenID).toEqual(meta.nftoken_id);
        });

        it('Should calculate right NFTokenID', () => {
            const { tx, meta } = nfTokenMintTemplate;
            const { nftoken_id } = meta;
            const instance = new NFTokenMint(tx, { ...meta, nftoken_id: undefined });
            expect(instance.NFTokenID).toEqual(nftoken_id);
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = nfTokenMintTemplate;
                const instance = new NFTokenMint(tx, meta);

                const expectedDescription = `${Localize.t('events.theTokenIdIs', {
                    tokenID: instance.NFTokenID,
                })}\n${Localize.t('events.theTokenHasATransferFee', {
                    transferFee: instance.TransferFee,
                })}\n${Localize.t('events.theTokenTaxonForThisTokenIs', { taxon: instance.NFTokenTaxon })}`;

                expect(NFTokenMintInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(NFTokenMintInfo.getLabel()).toEqual(Localize.t('events.mintNFT'));
            });
        });
    });

    describe('Validation', () => {});
});
