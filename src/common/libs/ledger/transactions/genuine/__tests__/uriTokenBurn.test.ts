/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { URITokenBurn, URITokenBurnInfo } from '../URITokenBurn';

import uriTokenBurnTemplate from './fixtures/URITokenBurnTx.json';

jest.mock('@services/NetworkService');

describe('URITokenBurn tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new URITokenBurn();
            expect(instance.TransactionType).toBe('URITokenBurn');
            expect(instance.Type).toBe('URITokenBurn');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = uriTokenBurnTemplate;
                const instance = new URITokenBurn(tx, meta);

                const expectedDescription = `This is an ${instance.Type} transaction`;

                expect(URITokenBurnInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(URITokenBurnInfo.getLabel()).toEqual(Localize.t('events.burnURIToken'));
            });
        });
    });

    describe('Validation', () => {});
});
