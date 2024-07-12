/* eslint-disable max-len */

import { MutationsMixin } from '@common/libs/ledger/mixin';

import Localize from '@locale';

import { SignIn, SignInInfo } from '..';

import { InstanceTypes } from '../../../types/enums';

import signInTemplate from './fixtures/SignInTx.json';

jest.mock('@services/NetworkService');

describe('SignIn pseudo tx', () => {
    describe('Class', () => {
        it('Should return right type and instance', () => {
            const instance = new SignIn();
            expect(instance.InstanceType).toBe(InstanceTypes.PseudoTransaction);
            expect(instance.Type).toBe('SignIn');
        });
    });

    describe('Info', () => {
        const { tx }: any = signInTemplate;
        const Mixed = MutationsMixin(SignIn);
        const instance = new Mixed(tx);
        const info = new SignInInfo(instance, {} as any);

        describe('generateDescription()', () => {
            it('should return the expected description', () => {
                expect(info.generateDescription).toThrowError('SignIn Pseudo transaction do not contain description!');
            });
        });

        describe('getEventsLabel()', () => {
            it('should return the expected label', () => {
                expect(info.getEventsLabel()).toEqual(Localize.t('global.signIn'));
            });
        });

        describe('getParticipants()', () => {
            it('should return the expected participants', () => {
                expect(info.getParticipants).toThrowError('SignIn Pseudo transaction do not contain participants!');
            });
        });

        describe('getMonetaryDetails()', () => {
            it('should throw error when requesting monetary details', () => {
                expect(info.getMonetaryDetails).toThrowError(
                    'SignIn Pseudo transaction do not contain monetary details!',
                );
            });
        });
    });

    describe('Validation', () => {});
});
