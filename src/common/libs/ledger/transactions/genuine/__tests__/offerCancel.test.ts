/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

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
            const { tx, meta }: any = offerCancelTemplates;
            const instance = new OfferCancel(tx, meta);

            expect(instance.OfferSequence).toBe(6);
            expect(instance.OfferID).toBe('EF963D9313AA45E85610598797D1A65E');
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = offerCancelTemplates;
        const Mixed = MutationsMixin(OfferCancel);
        const instance = new Mixed(tx, meta);
        const info = new OfferCancelInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `The transaction will cancel ra5nK24KXen9AHvsdFTKHSANinZseWnPcX's offer #6${'\n'}The transaction offer ID is: EF963D9313AA45E85610598797D1A65E`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.cancelOffer'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'ra5nK24KXen9AHvsdFTKHSANinZseWnPcX', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
