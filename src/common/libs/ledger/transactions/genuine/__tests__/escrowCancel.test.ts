/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import Localize from '@locale';
import { MutationsMixin } from '@common/libs/ledger/mixin';

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
            const { tx, meta }: any = escrowCancelTemplate;
            const instance = new EscrowCancel(tx, meta);

            expect(instance.Owner).toBe('rpmqbo5FWoydTL2Ufh5YdtzmRjbeLyxt56');
            expect(instance.EscrowID).toBe('EF963D9313AA45E85610598797D1A65E');
            expect(instance.OfferSequence).toBe(9);
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = escrowCancelTemplate;
        const MixedEscrowCancel = MutationsMixin(EscrowCancel);
        const instance = new MixedEscrowCancel(tx, meta);
        const info = new EscrowCancelInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `This is an EscrowCancel transaction${'\n'}The transaction escrow ID is: EF963D9313AA45E85610598797D1A65E`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.cancelEscrow'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rpmqbo5FWoydTL2Ufh5YdtzmRjbeLyxt56', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    mutate: {
                        DEC: [],
                        INC: [
                            {
                                action: 'INC',
                                currency: 'XRP',
                                value: '135.78999',
                            },
                        ],
                    },
                    factor: undefined,
                });
            });
        });
    });

    describe('Validation', () => {});
});
