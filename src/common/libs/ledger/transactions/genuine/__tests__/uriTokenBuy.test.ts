/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { URITokenBuy, URITokenBuyInfo } from '../URITokenBuy';

import uriTokenBuy from './fixtures/URITokenBuyTx.json';

import Localize from '@locale';

jest.mock('@services/NetworkService');

describe('URITokenBuy tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new URITokenBuy();
            expect(instance.TransactionType).toBe('URITokenBuy');
            expect(instance.Type).toBe('URITokenBuy');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = uriTokenBuy;
                const instance = new URITokenBuy(tx, meta);

                const expectedDescription = `${Localize.t('events.uriTokenBuyExplain', {
                    address: instance.Account.address,
                    amount: instance.Amount.value,
                    currency: instance.Amount.currency,
                    tokenID: instance.URITokenID,
                })}`;

                expect(URITokenBuyInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(URITokenBuyInfo.getLabel()).toEqual(Localize.t('events.buyURIToken'));
            });
        });
    });

    describe('Validation', () => {});
});
