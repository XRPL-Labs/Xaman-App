/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

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
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = nfTokenCancelOfferTemplate;
                const instance = new NFTokenCancelOffer(tx, meta);

                const expectedDescription = `${Localize.t('events.theTransactionWillCancelNftOffer', {
                    address: instance.Account.address,
                })}\n9C92E061381C1EF37A8CDE0E8FC35188BFC30B1883825042A64309AC09F4C36D\n736A0B59D00E8F74CABDB6A4217FC8E8E0F19A2EDB3F9145F4021E950746106F\n`;
                expect(NFTokenCancelOfferInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(NFTokenCancelOfferInfo.getLabel()).toEqual(Localize.t('events.cancelNFTOffer'));
            });
        });
    });

    describe('Validation', () => {});
});
