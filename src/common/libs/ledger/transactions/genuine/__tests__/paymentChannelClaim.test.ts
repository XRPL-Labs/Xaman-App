/* eslint-disable max-len */

import Localize from '@locale';

import { MutationsMixin } from '@common/libs/ledger/mixin';

import { PaymentChannelClaim, PaymentChannelClaimInfo } from '../PaymentChannelClaim';
import paymentChannelClaimTemplates from './fixtures/PaymentChannelClaimTx.json';

jest.mock('@services/NetworkService');

describe('PaymentChannelClaim tx', () => {
    describe('Class', () => {
        it('Should set tx type if not set', () => {
            const instance = new PaymentChannelClaim();
            expect(instance.TransactionType).toBe('PaymentChannelClaim');
            expect(instance.Type).toBe('PaymentChannelClaim');
        });

        it('Should return right parsed values', () => {
            const { tx, meta }: any = paymentChannelClaimTemplates;
            const instance = new PaymentChannelClaim(tx, meta);

            expect(instance.Channel).toBe('3BDB4F92432BCEB2385D3BAA60E8AAEC9B552890A240AEE4AA9E88C9E6C517E8');
            expect(instance.PublicKey).toBe('ED46FF956B8EEC4BA614B1A6B0B4343D623AE37A891A0461F1F51464CFC3442CF7');
            expect(instance.Signature).toBe(
                '55C8169517E6353A7168B4F6BE202C0C4D0828CBC3556D4576A3FF67D117F678AEC624FC98417460FA172F313FD920030C8C50B38542BD8744F578A568FB730B',
            );

            expect(instance.Amount).toEqual({ currency: 'XRP', value: '1' });
            expect(instance.Balance).toEqual({ currency: 'XRP', value: '49.65716' });
        });
    });

    describe('Info', () => {
        const { tx, meta }: any = paymentChannelClaimTemplates;
        const Mixed = MutationsMixin(PaymentChannelClaim);
        const instance = new Mixed(tx, meta);
        const info = new PaymentChannelClaimInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                const expectedDescription = `It will update the payment channel 3BDB4F92432BCEB2385D3BAA60E8AAEC9B552890A240AEE4AA9E88C9E6C517E8${'\n'}The channel balance claimed is 49.65716 XRP${'\n'}The payment channel will be closed. Any remaining funds will be returned to the source account.`;
                expect(info.generateDescription()).toEqual(expectedDescription);
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('events.claimPaymentChannel'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants()).toStrictEqual({
                    start: { address: 'rH11fDGhbVH5NVXNXkGAMTmfWhUHjCtA3B', tag: undefined },
                });
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should return the expected monetary details', () => {
                expect(info.getMonetaryDetails()).toStrictEqual({
                    factor: [
                        {
                            currency: 'XRP',
                            effect: 'IMMEDIATE_EFFECT',
                            value: '1',
                        },
                    ],
                    mutate: {
                        DEC: [],
                        INC: [
                            {
                                action: 'INC',
                                currency: 'XRP',
                                value: '9.659988',
                            },
                        ],
                    },
                });
            });
        });
    });

    describe('Validation', () => {});
});
