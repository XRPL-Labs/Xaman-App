/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

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
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = nFTokenBurnTemplate;
                const instance = new NFTokenBurn(tx, meta);

                const expectedDescription = `${Localize.t('events.nfTokenBurnExplain', {
                    tokenID: instance.NFTokenID,
                })}`;
                expect(NFTokenBurnInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(NFTokenBurnInfo.getLabel()).toEqual(Localize.t('events.burnNFT'));
            });
        });
    });

    describe('Validation', () => {});
});
