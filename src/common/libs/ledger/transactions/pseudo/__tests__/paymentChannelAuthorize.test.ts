/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import { MutationsMixin } from '@common/libs/ledger/mixin';

import Localize from '@locale';

import { PaymentChannelAuthorize, PaymentChannelAuthorizeInfo } from '..';

import { InstanceTypes } from '../../../types/enums';

import paymentChannelAuthorizeTemplate from './fixtures/PaymentChannelAuthorizeTx.json';

jest.mock('@services/NetworkService');

describe('PaymentChannelAuthorize pseudo tx', () => {
    describe('Class', () => {
        it('Should return right type and instance', () => {
            const instance = new PaymentChannelAuthorize();
            expect(instance.InstanceType).toBe(InstanceTypes.PseudoTransaction);
            expect(instance.Type).toBe('PaymentChannelAuthorize');
        });
    });

    describe('Info', () => {
        const { tx }: any = paymentChannelAuthorizeTemplate;
        const Mixed = MutationsMixin(PaymentChannelAuthorize);
        const instance = new Mixed(tx);
        const info = new PaymentChannelAuthorizeInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                expect(info.generateDescription).toThrowError(
                    'PaymentChannelAuthorize Pseudo transaction do not contain description!',
                );
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('global.paymentChannelAuthorize'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants).toThrowError(
                    'PaymentChannelAuthorize Pseudo transactions do not contain participants!',
                );
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should throw error when requesting monetary details', () => {
                expect(info.getMonetaryDetails).toThrowError(
                    'PaymentChannelAuthorize Pseudo transactions do not contain monetary details!',
                );
            });
        });
    });

    describe('Validation', () => {});
});
