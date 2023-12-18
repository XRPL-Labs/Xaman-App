/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { EscrowFinish, EscrowFinishInfo } from '../EscrowFinish';
import escrowFinishTemplate from './fixtures/EscrowFinishTx.json';

jest.mock('@services/NetworkService');

describe('EscrowFinish', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new EscrowFinish();
            expect(instance.TransactionType).toBe('EscrowFinish');
            expect(instance.Type).toBe('EscrowFinish');
        });

        it('Should return right parsed values', () => {
            const { tx, meta } = escrowFinishTemplate;
            const instance = new EscrowFinish(tx, meta);

            expect(instance.Destination).toStrictEqual({
                tag: 1337,
                address: 'rrrrrrrrrrrrrrrrrrrrrholvtp',
            });
            expect(instance.Amount).toStrictEqual({
                currency: 'XRP',
                value: '500000000',
            });

            expect(instance.Owner).toBe(tx.Owner);

            expect(instance.Fulfillment).toBe(tx.Fulfillment);
            expect(instance.Condition).toBe(tx.Condition);
            expect(instance.EscrowID).toBe(tx.EscrowID);

            expect(instance.OfferSequence).toBe(tx.OfferSequence);
        });
    });

    describe('Info', () => {
        describe('getDescription()', () => {
            it('should return the expected description', () => {
                const { tx, meta } = escrowFinishTemplate;
                const instance = new EscrowFinish(tx, meta);

                const expectedDescription =
                    'Completion was triggered by rrrrrrrrrrrrrrrrrrrrbzbvji\r\n' +
                    'The escrowed amount of 500000000 XRP was delivered to rrrrrrrrrrrrrrrrrrrrrholvtp\n' +
                    'The escrow has a destination tag: 1337\n' +
                    'The transaction escrow ID is: EF963D9313AA45E85610598797D1A65E\n' +
                    'The escrow was created by rrrrrrrrrrrrrrrrrrrrrholvtp';

                expect(EscrowFinishInfo.getDescription(instance)).toEqual(expectedDescription);
            });
        });

        describe('getLabel()', () => {
            it('should return the expected label', () => {
                expect(EscrowFinishInfo.getLabel()).toEqual(Localize.t('events.finishEscrow'));
            });
        });
    });

    describe('Validation', () => {});
});
