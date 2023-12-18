/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { EscrowCancel, EscrowCancelInfo } from '../EscrowCancel';
import escrowCancelTemplate from './fixtures/EscrowCancelTx.json';

jest.mock('@services/NetworkService');

describe('EscrowCancel tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new EscrowCancel();
            expect(instance.TransactionType).toBe('EscrowCancel');
            expect(instance.Type).toBe('EscrowCancel');
        });

        it('Should return right parsed values', () => {
            const { tx, meta } = escrowCancelTemplate;
            const instance = new EscrowCancel(tx, meta);

            expect(instance.Owner).toBe('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.EscrowID).toBe(tx.EscrowID);

            expect(instance.OfferSequence).toBe(7);
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = escrowCancelTemplate;
                const instance = new EscrowCancel(tx, meta);

                // TODO: add description tests
                const expectedDescription = `${`This is an ${instance.Type} transaction`}\n${Localize.t(
                    'events.theTransactionHasAEscrowId',
                    {
                        escrowId: tx.EscrowID,
                    },
                )}`;

                expect(EscrowCancelInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(EscrowCancelInfo.getLabel()).toEqual(Localize.t('events.cancelEscrow'));
            });
        });
    });

    describe('Validation', () => {});
});
