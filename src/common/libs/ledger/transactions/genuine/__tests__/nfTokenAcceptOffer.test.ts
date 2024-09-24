/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { NFTokenAcceptOffer, NFTokenAcceptOfferInfo } from '../NFTokenAcceptOffer';
import nFTokenAcceptOfferTemplate from './fixtures/NFTokenAcceptOfferTx.json';

jest.mock('@services/NetworkService');

describe('NFTokenAcceptOffer', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new NFTokenAcceptOffer();
            expect(instance.TransactionType).toBe('NFTokenAcceptOffer');
            expect(instance.Type).toBe('NFTokenAcceptOffer');
        });

        it('Should return right parsed values', () => {
            const { tx, meta } = nFTokenAcceptOfferTemplate;
            const instance = new NFTokenAcceptOffer(tx, meta);

            expect(instance.NFTokenSellOffer).toBe('D68E2D453EBA6468C3BE8FFE4F73EA077A5B7EE6712082D213212D83FDF7245E');
            expect(instance.NFTokenBuyOffer).toBe('13471FEBC1F76E6174D4FE5E334BD8DF1C7243EFFD7583A5DDB75DD2EC3CB347');
            expect(instance.NFTokenBrokerFee).toStrictEqual({
                currency: 'XRP',
                value: '1',
            });
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = nFTokenAcceptOfferTemplate;
                const instance = new NFTokenAcceptOffer(tx, meta);

                // TODO: add description tests
                // const expectedDescription = Localize.t('events.itAuthorizesSendingPaymentsToThisAccount', {
                //     address: tx.Authorize,
                // });
                //
                // expect(EscrowCancelInfo.getDescription(instance)).toEqual(expectedDescription);

                expect(instance).toBeDefined();
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(NFTokenAcceptOfferInfo.getLabel()).toEqual(Localize.t('events.acceptNFTOffer'));
            });
        });
    });

    describe('Validation', () => {});
});
