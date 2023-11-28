/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';
import moment from 'moment-timezone';

import { NormalizeCurrencyCode } from '@common/utils/amount';

import { NFTokenCreateOffer, NFTokenCreateOfferInfo } from '../NFTokenCreateOffer';
import nfTokenCreateOfferTemplate from './fixtures/NFTokenCreateOfferTx.json';

jest.mock('@services/NetworkService');

describe('NFTokenCreateOffer tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new NFTokenCreateOffer();
            expect(instance.TransactionType).toBe('NFTokenCreateOffer');
            expect(instance.Type).toBe('NFTokenCreateOffer');
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description for sell offer', () => {
                const { tx, meta } = nfTokenCreateOfferTemplate.sellOffer;
                const instance = new NFTokenCreateOffer(tx, meta);

                const expectedDescription = `${Localize.t('events.nftOfferSellExplain', {
                    address: instance.Account.address,
                    tokenID: instance.NFTokenID,
                    amount: instance.Amount.value,
                    currency: NormalizeCurrencyCode(instance.Amount.currency),
                })}\n${Localize.t('events.theNftOwnerIs', { address: instance.Owner })}\n${Localize.t(
                    'events.thisNftOfferMayOnlyBeAcceptedBy',
                    {
                        address: instance.Destination.address,
                    },
                )}\n${Localize.t('events.theOfferExpiresAtUnlessCanceledOrAccepted', {
                    expiration: moment(instance.Expiration).format('LLLL'),
                })}`;

                expect(NFTokenCreateOfferInfo.getDescription(instance)).toEqual(expectedDescription);
            });

            it('should return the expected description for buy offer', () => {
                const { tx, meta } = nfTokenCreateOfferTemplate.buyOffer;
                const instance = new NFTokenCreateOffer(tx, meta);

                const expectedDescription = `${Localize.t('events.nftOfferBuyExplain', {
                    address: instance.Account.address,
                    tokenID: instance.NFTokenID,
                    amount: instance.Amount.value,
                    currency: NormalizeCurrencyCode(instance.Amount.currency),
                })}`;

                expect(NFTokenCreateOfferInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(NFTokenCreateOfferInfo.getLabel()).toEqual(Localize.t('events.createNFTOffer'));
            });
        });
    });

    describe('Validation', () => {});
});
