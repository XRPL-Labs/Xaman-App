/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

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
        const { tx, meta }: any = uriTokenMintTemplate;
        const Mixed = MutationsMixin(URITokenMint);
        const instance = new Mixed(tx, meta);
        const info = new URITokenMintInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The URI for this token is 697066733A2F2F434944${'\n'}The token has a digest: 697066733A2F2F434944697066733A2F2F434944697066733A2F2F434944${'\n'}The minter of this token has set the initial selling price to 1 XRP.${'\n'}This token can only be purchased by rDestinationxxxxxxxxxxxxxxxxxxxxxx`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });
        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.mintURIToken'));
            });
        });
    });

    describe('Validation', () => {});
});
