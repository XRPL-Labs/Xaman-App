import { TransactionTypes } from '@common/libs/ledger/types/enums';
import Memo from '@common/libs/ledger/parser/common/memo';

import BaseGenuineTransaction from '../base';

import BaseTxTemplate from './fixtures/BaseTx.json';

jest.mock('@services/NetworkService');

describe('BaseGenuineTransaction', () => {
    describe('Set & Get', () => {
        it('Should return right parsed values for all common fields', () => {
            const { tx, meta }: any = BaseTxTemplate;

            const instance = new BaseGenuineTransaction(tx, meta);

            expect(instance.Account).toBe(tx.Account);
            expect(instance.SourceTag).toBe(tx.SourceTag);
            expect(instance.Memos).toStrictEqual([
                { MemoData: 'XRP Tip Bot', MemoFormat: undefined, MemoType: 'XrpTipBotNote' },
            ]);
            expect(instance.Fee).toStrictEqual({ currency: 'XRP', value: '0.000012' });
            expect(instance.hash).toBe(tx.hash);
            expect(instance.SigningPubKey).toBe(tx.SigningPubKey);
            expect(instance.LastLedgerSequence).toBe(tx.LastLedgerSequence);
            expect(instance.Sequence).toBe(tx.Sequence);
            expect(instance.TxnSignature).toBe(tx.TxnSignature);
            expect(instance.NetworkID).toBe(tx.NetworkID);
            expect(instance.OperationLimit).toBe(tx.OperationLimit);
            expect(instance.FirstLedgerSequence).toBe(tx.FirstLedgerSequence);
            expect(instance.TicketSequence).toBe(tx.TicketSequence);
            expect(instance.Signers).toStrictEqual(tx.Signers.map((item: any) => item.Signer));
            expect(instance.HookParameters).toStrictEqual(tx.HookParameters.map((item: any) => item.HookParameter));
        });

        it('Should Set/Get common fields', () => {
            const { tx }: any = BaseTxTemplate;

            const instance = new BaseGenuineTransaction();

            instance.TransactionType = TransactionTypes.Payment;
            expect(instance.TransactionType).toBe(TransactionTypes.Payment);

            instance.Account = tx.Account;
            expect(instance.Account).toBe(tx.Account);

            expect(instance.Memos).toBeUndefined();
            instance.Memos = [Memo.Encode('Memo Description')];
            expect(instance.Memos).toStrictEqual([
                { MemoData: 'Memo Description', MemoFormat: 'text/plain', MemoType: 'Description' },
            ]);

            instance.Fee = { currency: 'XRP', value: '0.000012' };
            expect(instance.Fee).toStrictEqual({ currency: 'XRP', value: '0.000012' });

            instance.hash = '123';

            // eslint-disable-next-line guard-for-in
            for (const field of [
                'hash',
                'Sequence',
                'LastLedgerSequence',
                'SigningPubKey',
                'FirstLedgerSequence',
                'OperationLimit',
                'NetworkID',
                'TicketSequence',
                'TxnSignature',
            ]) {
                expect(tx[field]).toBeDefined();
                // @ts-ignore
                instance[field] = tx[field];
                // @ts-ignore
                expect(instance[field]).toBe(tx[field]);
            }

            instance.Signers = tx.Signers.map((item: any) => item.Signer);
            expect(instance.Signers).toStrictEqual(tx.Signers.map((item: any) => item.Signer));

            instance.Flags = { tfPartialPayment: true };

            expect(instance.Flags).toStrictEqual({
                tfPartialPayment: true,
                tfLimitQuality: false,
                tfNoRippleDirect: false,
            });
        });

        it('should return an tx json with only the allowed fields', () => {
            const txData = {
                TransactionType: TransactionTypes.Payment,
                Account: 'rAccountxxxxxxxxxxxxxxxxxxxxxxxxxx',
                Amount: 1337,
                RegularKey: 'rAccountxxxxxxxxxxxxxxxxxxxxxxxxxx',
            };

            const transaction = new BaseGenuineTransaction(txData);
            const jsonResult = transaction.JsonForSigning;

            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { RegularKey, Amount, ...expectedResult } = txData;

            expect(jsonResult).toStrictEqual(expectedResult);
        });
    });
});
