/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */
import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

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
            const { tx, meta }: any = escrowFinishTemplate;
            const instance = new EscrowFinish(tx, meta);

            expect(instance.Escrow.Destination).toBe('rrrrrrrrrrrrrrrrrrrrrholvtp');
            expect(instance.Escrow.DestinationTag).toBe(1337);
            expect(instance.Escrow.Amount).toStrictEqual({
                currency: 'XRP',
                value: '500000000',
            });

            expect(instance.Owner).toBe('rrrrrrrrrrrrrrrrrrrrrholvtp');

            expect(instance.Fulfillment).toBe('A0028000');
            expect(instance.Condition).toBe(
                'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
            );
            expect(instance.EscrowID).toBe('EF963D9313AA45E85610598797D1A65E');

            expect(instance.OfferSequence).toBe(22);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = escrowFinishTemplate;
        const MixedEscrowFinish = MutationsMixin(EscrowFinish);
        const instance = new MixedEscrowFinish(tx, meta);
        const info = new EscrowFinishInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `Completion was triggered by rrrrrrrrrrrrrrrrrrrrbzbvji${'\r\n'}The escrowed amount of 500000000 XRP was delivered to rrrrrrrrrrrrrrrrrrrrrholvtp${'\n'}The escrow has a destination tag: 1337${'\n'}The transaction escrow ID is: EF963D9313AA45E85610598797D1A65E${'\n'}The escrow was created by rrrrrrrrrrrrrrrrrrrrrholvtp`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.finishEscrow'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: undefined },
                    end: { address: 'rrrrrrrrrrrrrrrrrrrrrholvtp', tag: 1337 },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                // TODO: check me
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            currency: 'XRP',
                            effect: 'NO_EFFECT',
                            value: '500000000',
                        },
                    ],
                    mutate: {
                        DEC: [],
                        INC: [],
                    },
                });
            });
        });
    });

    describe('Validation', () => {});
});
