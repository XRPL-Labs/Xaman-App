/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';

import { OfferCancel, OfferCancelInfo } from '../OfferCancel';
import offerCancelTemplates from './fixtures/OfferCancelTx.json';

jest.mock('@services/NetworkService');

describe('OfferCancel tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new OfferCancel();
            expect(instance.TransactionType).toBe('OfferCancel');
            expect(instance.Type).toBe('OfferCancel');
        });

        it('Should return right parsed values', () => {
            const { tx, meta } = offerCancelTemplates;
            const instance = new OfferCancel(tx, meta);

            expect(instance.OfferSequence).toBe(6);
            expect(instance.OfferID).toBe(tx.OfferID);
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = offerCancelTemplates;
                const instance = new OfferCancel(tx, meta);

                const expectedDescription = `${Localize.t('events.theTransactionWillCancelOffer', {
                    address: instance.Account.address,
                    offerSequence: instance.OfferSequence,
                })}\n${Localize.t('events.theTransactionHasAOfferId', { offerId: tx.OfferID })}`;

                expect(OfferCancelInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(OfferCancelInfo.getLabel()).toEqual(Localize.t('events.cancelOffer'));
            });
        });
    });

    describe('Validation', () => {});
});
