/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { URITokenMint, URITokenMintInfo } from '../URITokenMint';

import uriTokenMintTemplate from './fixtures/URITokenMintTx.json';

jest.mock('@services/NetworkService');

describe('URITokenMint tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new URITokenMint();
            expect(instance.TransactionType).toBe('URITokenMint');
            expect(instance.Type).toBe('URITokenMint');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = uriTokenMintTemplate;
                const instance = new URITokenMint(tx, meta);

                const expectedDescription = `${Localize.t('events.theURIForThisTokenIs', {
                    uri: instance.URI,
                })}\n${Localize.t('events.theTokenHasADigest', { digest: instance.Digest })}\n${Localize.t(
                    'events.uriTokenMintAmount',
                    { value: instance.Amount.value, currency: instance.Amount.currency },
                )}\n${Localize.t('events.uriTokenDestinationExplain', { address: instance.Destination.address })}`;

                expect(URITokenMintInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(URITokenMintInfo.getLabel()).toEqual(Localize.t('events.mintURIToken'));
            });
        });
    });

    describe('Validation', () => {});
});
