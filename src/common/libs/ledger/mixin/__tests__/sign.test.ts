import LedgerService from '@services/LedgerService';
import NetworkService from '@services/NetworkService';

import { SignMixin } from '../Sign.mixin';
import { BaseTransaction } from '../../transactions';

jest.mock('@services/NetworkService');

describe('Sign Mixin', () => {
    const Mixed = SignMixin(BaseTransaction);

    it('Should return right transaction result', () => {
        const instance = new Mixed();

        // transaction already verified by network
        // @ts-ignore
        instance._meta.TransactionResult = 'tesSUCCESS';

        expect(instance.TransactionResult).toStrictEqual({
            success: true,
            code: 'tesSUCCESS',
            message: undefined,
        });

        // transaction is not verified by network and failed
        // @ts-ignore
        instance._meta.TransactionResult = 'tecNO_LINE_INSUF_RESERVE';

        instance.SubmitResult = {
            success: true,
            engineResult: 'tecNO_LINE_INSUF_RESERVE',
            message: 'No such line. Too little reserve to create it.',
            network: {
                id: 0,
                node: 'wss://xrplcluster.com',
                type: 'Mainnet',
                key: 'MAINNET',
            },
        };

        instance.VerifyResult = {
            success: false,
        };

        expect(instance.TransactionResult).toStrictEqual({
            success: false,
            code: 'tecNO_LINE_INSUF_RESERVE',
            message: 'No such line. Too little reserve to create it.',
        });

        // transaction is not verified by network and hard failed
        // @ts-ignore
        instance._meta.TransactionResult = undefined;

        instance.SubmitResult = {
            success: false,
            engineResult: 'temBAD_FEE',
            message: 'temBAD_FEE description',
            network: {
                id: 0,
                node: 'wss://xrplcluster.com',
                type: 'Mainnet',
                key: 'MAINNET',
            },
        };

        instance.VerifyResult = {
            success: false,
        };

        expect(instance.TransactionResult).toStrictEqual({
            success: false,
            code: 'temBAD_FEE',
            message: 'temBAD_FEE description',
        });
    });

    it('Should be able to prepare the transaction for signing', async () => {
        const address = 'rrrrrrrrrrrrrrrrrrrrrholvtp';

        // mock the ledger service response
        const spy = jest.spyOn(LedgerService, 'getAccountInfo').mockImplementation(() =>
            Promise.resolve({
                account_data: {
                    Account: address,
                    Balance: '49507625423',
                    Flags: 131072,
                    OwnerCount: 1135,
                    PreviousTxnID: '48DB4C987EDE802030089C48F27FF7A0F589EBA7C3A9F90873AA030D5960F149',
                    PreviousTxnLgrSeq: 58057100,
                    Sequence: 34321,
                },
                id: 'id',
                _networkId: 0,
            } as any),
        );

        await new Mixed({ TransactionType: 'Payment' } as any).prepare({ address } as any).catch((e) => {
            expect(e.message).toBe(
                'Transaction fee is not set, please wait until transaction fee is set and try again!',
            );
        });

        // create a transaction instance for signing
        const instance = new Mixed({
            TransactionType: 'Payment',
            Fee: '12',
        } as any);

        // prepare the transaction by applying the private key
        await instance.prepare({ address } as any);

        // should set the sequence number
        expect(instance.Sequence).toBe(34321);

        spy.mockRestore();
    });

    it('Should be able to populate the transaction LastLedgerSequence', async () => {
        const LastLedger = 68312096;

        // mock the ledger service response
        const spy = jest.spyOn(LedgerService, 'getLedgerStatus').mockImplementation(() => {
            return { Fee: 12, LastLedger };
        });

        // should set if LastLedgerSequence undefined
        const instance = new Mixed({
            TransactionType: 'Payment',
            Fee: '12',
        } as any);

        instance.populateFields();
        expect(instance.LastLedgerSequence).toBe(LastLedger + 10);

        // should update LastLedgerSequence if sequence is passed
        instance.LastLedgerSequence = LastLedger - 500;
        instance.populateFields();
        expect(instance.LastLedgerSequence).toBe(LastLedger + 10);

        // should update LastLedgerSequence if sequence is less than 32570
        instance.LastLedgerSequence = 50;
        instance.populateFields();
        expect(instance.LastLedgerSequence).toBe(LastLedger + 50);

        spy.mockRestore();
    });

    describe('Should be able to handle setting NetworkID', () => {
        let getLedgerStatusSpy: any;

        beforeAll(() => {
            // mock the ledger service response
            getLedgerStatusSpy = jest.spyOn(LedgerService, 'getLedgerStatus').mockImplementation(() => {
                return { Fee: 12, LastLedger: 123 };
            });
        });

        afterAll(() => {
            getLedgerStatusSpy.mockRestore();
        });

        it('Should populate the transaction NetworkID on NON legacy networks', async () => {
            const connectedNetworkId = 1337;

            // mock the ledger service response
            const spy = jest.spyOn(NetworkService, 'getNetworkId').mockImplementation(() => {
                return connectedNetworkId;
            });

            const instance = new Mixed({
                TransactionType: 'Payment',
                Fee: '12',
            } as any);

            instance.populateFields();
            expect(instance.NetworkID).toBe(connectedNetworkId);

            spy.mockRestore();
        });

        it('Should not populate the transaction NetworkID on legacy networks', async () => {
            const connectedNetworkId = 0;

            // mock the ledger service response
            const spy = jest.spyOn(NetworkService, 'getNetworkId').mockImplementation(() => {
                return connectedNetworkId;
            });

            // should set if LastLedgerSequence undefined
            const instance = new Mixed({
                TransactionType: 'Payment',
                Fee: '12',
            } as any);

            instance.populateFields();
            expect(instance.NetworkID).toBe(undefined);

            spy.mockRestore();
        });
    });
});
