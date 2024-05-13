/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { NFTokenCancelOffer, NFTokenCancelOfferInfo } from '../NFTokenCancelOffer';
import nfTokenCancelOfferTemplate from './fixtures/NFTokenCancelOfferTx.json';

jest.mock('@services/NetworkService');

describe('NFTokenCancelOffer tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new NFTokenCancelOffer();
            expect(instance.TransactionType).toBe('NFTokenCancelOffer');
            expect(instance.Type).toBe('NFTokenCancelOffer');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = nfTokenCancelOfferTemplate;
            const instance = new NFTokenCancelOffer(tx, meta);

            expect(instance.NFTokenOffers).toStrictEqual([
                '9C92E061381C1EF37A8CDE0E8FC35188BFC30B1883825042A64309AC09F4C36D',
                '736A0B59D00E8F74CABDB6A4217FC8E8E0F19A2EDB3F9145F4021E950746106F',
            ]);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = nfTokenCancelOfferTemplate;
        const Mixed = MutationsMixin(NFTokenCancelOffer);
        const instance = new Mixed(tx, meta);
        const info = new NFTokenCancelOfferInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `${Localize.t('events.theTransactionWillCancelNftOffer', {
                    address: 'rrrrrrrrrrrrrrrrrrrrrholvtp',
                })}\n9C92E061381C1EF37A8CDE0E8FC35188BFC30B1883825042A64309AC09F4C36D\n736A0B59D00E8F74CABDB6A4217FC8E8E0F19A2EDB3F9145F4021E950746106F`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.cancelNFTOffer'));
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
