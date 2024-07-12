/* eslint-disable max-len */
import ApiService, { ApiError } from '@services/ApiService';

import { PseudoTransactionTypes } from '../../ledger/types/enums';

import { Payload } from '../object';
import { PayloadOrigin } from '../types';

import PayloadTemplate from './templates/payload.json';

describe('Payload', () => {
    it('Should be able to generate payload and return right values', () => {
        const transaction = {
            TransactionType: 'Payment',
            Account: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
            Destination: 'rXUMMaPpZqPutoRszR29jtC8amWq3APkx',
            Amount: '1337',
        } as any;

        const craftedPayload = Payload.build(transaction);

        expect(craftedPayload.isGenerated()).toBe(true);
        expect(craftedPayload.getTransactionType()).toBe('Payment');
        expect(craftedPayload.getApplicationIcon()).toBe(
            'https://xumm-cdn.imgix.net/app-logo/91348bab-73d2-489a-bb7b-a8dba83e40ff.png',
        );
        expect(craftedPayload.getApplicationName()).toBe('Xaman');
        expect(craftedPayload.getTransaction().JsonForSigning).toEqual(transaction);
        expect(craftedPayload.getSigners()).toEqual(['rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY']);

        const payloadPatchSpy = jest.spyOn(ApiService.payload, 'patch');
        // @ts-ignore
        craftedPayload.patch({ signed_blob: '', tx_id: '', multisigned: '' });
        expect(payloadPatchSpy).toBeCalledTimes(0);
        payloadPatchSpy.mockClear();

        const payloadRejectSpy = jest.spyOn(ApiService.payload, 'patch');
        craftedPayload.reject('USER');
        expect(payloadRejectSpy).toBeCalledTimes(0);
        payloadRejectSpy.mockClear();
    });

    it('Should be able fetch/verify payload', async () => {
        const { AccountSet: AccountSetPayload } = PayloadTemplate;

        const payloadFetchSpy = jest
            .spyOn(ApiService.payload, 'get')
            .mockImplementation(() => Promise.resolve(AccountSetPayload));

        const fetchedPayload = await Payload.from(AccountSetPayload.meta.uuid);

        expect(fetchedPayload.isGenerated()).toBe(false);
        expect(fetchedPayload.getTransactionType()).toBe('AccountSet');

        payloadFetchSpy.mockClear();
    });

    it('Should reject fetched payload if not verified ', async () => {
        const { AccountSet: AccountSetPayload } = PayloadTemplate;

        const invalidTypesPayload = JSON.parse(JSON.stringify(AccountSetPayload));
        invalidTypesPayload.payload.tx_type = 'Something';
        invalidTypesPayload.payload.request_json.TransactionType = 'SomethingElse';

        let payloadFetchSpy = jest
            .spyOn(ApiService.payload, 'get')
            .mockImplementation(() => Promise.resolve(Object.assign(invalidTypesPayload)));

        try {
            await Payload.from(invalidTypesPayload.meta.uuid);
        } catch (error: any) {
            expect(error.message).toEqual('Unable to verify the payload signature');
        }

        payloadFetchSpy.mockClear();

        payloadFetchSpy = jest
            .spyOn(ApiService.payload, 'get')
            .mockImplementation(() => Promise.resolve(AccountSetPayload));

        const invalidSignInPayload = JSON.parse(JSON.stringify(AccountSetPayload));
        invalidSignInPayload.payload.tx_type = 'SignIn';
        invalidSignInPayload.payload.request_json.TransactionType = 'SomeTransactionType';

        try {
            await Payload.from(invalidSignInPayload.meta.uuid);
        } catch (error: any) {
            expect(error.message).toEqual('Unable to verify the payload signature');
        }

        payloadFetchSpy.mockClear();
    });

    it('Should reject the paylaod if not be able to verify', async () => {
        const { InvalidPayload } = PayloadTemplate;

        const payloadFetchSpy = jest
            .spyOn(ApiService.payload, 'get')
            .mockImplementation(() => Promise.resolve(InvalidPayload));

        try {
            await Payload.from(InvalidPayload.meta.uuid);
        } catch (error: any) {
            expect(error.message).toEqual('Unable to verify the payload signature');
        }

        payloadFetchSpy.mockClear();
    });

    it('Should be able return right values for assigned payload', async () => {
        const { AccountSet: AccountSetPayload }: any = PayloadTemplate;

        const fetchedPayload = await Payload.from(AccountSetPayload);

        expect(fetchedPayload.isGenerated()).toBe(false);
        expect(fetchedPayload.shouldSubmit()).toBe(true);
        expect(fetchedPayload.getTransactionType()).toBe('AccountSet');
        expect(fetchedPayload.getApplicationIcon()).toBe(AccountSetPayload.application.icon_url);
        expect(fetchedPayload.getApplicationName()).toBe(AccountSetPayload.application.name);
        expect(fetchedPayload.getReturnURL()).toBe(AccountSetPayload.meta.return_url_app);
        expect(fetchedPayload.getPayloadUUID()).toBe(AccountSetPayload.meta.uuid);
        expect(fetchedPayload.getTransaction().JsonForSigning).toEqual(AccountSetPayload.payload.request_json);
        expect(fetchedPayload.getOrigin()).toEqual(PayloadOrigin.UNKNOWN);
    });

    it('Should be able return right values SignIn payload', async () => {
        const { SignIn: SignInPayload }: any = PayloadTemplate;
        const fetchedPayload = await Payload.from(SignInPayload, PayloadOrigin.DEEP_LINK);

        expect(fetchedPayload.isGenerated()).toBe(false);
        expect(fetchedPayload.isPseudoTransaction()).toBe(true);
        expect(fetchedPayload.shouldSubmit()).toBe(false);
        expect(fetchedPayload.getTransactionType()).toBe('SignIn');
        expect(fetchedPayload.getTransaction().JsonForSigning).toEqual({});
        expect(fetchedPayload.getTransaction().Type).toEqual(PseudoTransactionTypes.SignIn);
        expect(fetchedPayload.getOrigin()).toEqual(PayloadOrigin.DEEP_LINK);
    });

    it('Should be able return right values for MultiSign payload', async () => {
        const { AccountSet: AccountSetPayload } = PayloadTemplate;

        // set multiSign flag
        const multiSingPayload = JSON.parse(JSON.stringify(AccountSetPayload));
        multiSingPayload.meta.multisign = true;

        const fetchedPayload = await Payload.from(multiSingPayload, PayloadOrigin.DEEP_LINK);

        expect(fetchedPayload.isMultiSign()).toBe(true);
        expect(fetchedPayload.shouldSubmit()).toBe(false);
    });

    it('Should throw error if payload is resolved or expired', async () => {
        const { AccountSet: AccountSetPayload } = PayloadTemplate;

        const payloadFetchSpy = jest.spyOn(ApiService.payload, 'get').mockImplementation(() =>
            Promise.resolve({
                ...AccountSetPayload,
                ...{
                    response: {
                        resolved_at: 'SOME_VALUE',
                    },
                },
            }),
        );

        try {
            await Payload.from(AccountSetPayload.meta.uuid);
        } catch (error: any) {
            expect(error.message).toEqual(
                'This payload has already been signed or rejected. Please repeat the process that generated the request, and scan the new request.',
            );
        }

        payloadFetchSpy.mockClear();

        const payloadFetchSpy2 = jest.spyOn(ApiService.payload, 'get').mockImplementation(() =>
            Promise.resolve({
                ...AccountSetPayload,
                ...{
                    meta: {
                        expired: true,
                    },
                },
            }),
        );

        try {
            await Payload.from(AccountSetPayload.meta.uuid);
        } catch (error: any) {
            expect(error.message).toEqual(
                'This payload has expired. Please repeat the process that generated the request, and scan the new request.',
            );
        }

        payloadFetchSpy2.mockClear();
    });

    it('Should throw error if payload is handled by other user', async () => {
        const { AccountSet: AccountSetPayload } = PayloadTemplate;

        const payloadFetchSpy = jest
            .spyOn(ApiService.payload, 'get')
            .mockImplementation(() => Promise.reject(new ApiError('message', 403, 'refrence')));

        try {
            await Payload.from(AccountSetPayload.meta.uuid);
        } catch (error: any) {
            expect(error.message).toEqual('Payload handled by another client');
        }

        payloadFetchSpy.mockClear();
    });

    it('Should throw error if transaction types are mismatch', async () => {
        const { AccountSet: AccountSetPayload } = PayloadTemplate;

        const invalidTypePayload = JSON.parse(JSON.stringify(AccountSetPayload));
        invalidTypePayload.payload.tx_type = 'Payment';

        // @ts-ignore
        const payload = await Payload.from(invalidTypePayload);

        try {
            payload.getTransaction();
        } catch (error: any) {
            expect(error.message).toEqual('Parsed transaction have invalid transaction type!');
        }
    });

    it('Should throw error if transaction type is not supported', async () => {
        const { AccountSet: AccountSetPayload }: any = PayloadTemplate;

        // set unsupported type
        const unsupportedTypePayload = JSON.parse(JSON.stringify(AccountSetPayload));
        unsupportedTypePayload.payload.request_json.TransactionType = 'Unsupported';

        // @ts-ignore
        const payload = await Payload.from(AccountSetPayload);

        try {
            payload.getTransaction();
        } catch (error: any) {
            expect(error.message).toEqual('Requested transaction type is not supported in Xaman!');
        }
    });

    it('Should throw error if transaction and crafted tx have different type', async () => {
        const { AccountSet: AccountSetPayload }: any = PayloadTemplate;

        // set unsupported type
        AccountSetPayload.payload.tx_type = 'SignIn';

        const payload = await Payload.from(AccountSetPayload);

        try {
            payload.getTransaction();
        } catch (error: any) {
            expect(error.message).toEqual('Parsed transaction have invalid transaction type!');
        }
    });
});
