/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';
import { AssetTypes } from '@common/libs/ledger/factory/types';

import { URITokenBuy, URITokenBuyInfo } from '../URITokenBuy';
import uriTokenBuy from './fixtures/URITokenBuyTx.json';

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
        const { tx, meta }: any = uriTokenBuy;
        const Mixed = MutationsMixin(URITokenBuy);
        const instance = new Mixed(tx, meta);
        const info = new URITokenBuyInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription =
                    'rrrrrrrrrrrrrrrrrrrrrholvtp paid 10 XRP in order to receive an URI token with ID 716E5990589AA8FA4247E0FEABE8B605CFFBBA5CA519A70BCA37C8CC173F3244';
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.buyURIToken'));
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
                    factor: [
                        {
                            currency: 'XRP',
                            effect: 'IMMEDIATE_EFFECT',
                            value: '10',
                        },
                    ],
                    mutate: {
                        DEC: [
                            {
                                action: 'DEC',
                                currency: 'XRP',
                                value: '10',
                            },
                        ],
                        INC: [],
                    },
                });
            });
        });

        describe('getAssetDetails()', () => {
            it('should return the expected asset details', () => {
                expect(info.getAssetDetails()).toStrictEqual([
                    {
                        owner: 'rrrrrrrrrrrrrrrrrrrrrholvtp',
                        type: AssetTypes.URIToken,
                        uriTokenId: '716E5990589AA8FA4247E0FEABE8B605CFFBBA5CA519A70BCA37C8CC173F3244',
                    },
                ]);
            });
        });
    });

    describe('Validation', () => {});
});
