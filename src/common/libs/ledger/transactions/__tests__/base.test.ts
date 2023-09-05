/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import LedgerService from '@services/LedgerService';
import BaseTransaction from '../base';

import Memo from '../../parser/common/memo';

import txTemplates from './templates/BaseTx.json';
import paymentTemplates from './templates/PaymentTx.json';

jest.mock('@services/NetworkService');

describe('BaseTransaction tx', () => {
    it('Should return right parsed values', () => {
        const { tx, meta } = txTemplates;

        const instance = new BaseTransaction(tx, meta);

        expect(instance.Account).toStrictEqual({
            tag: 456,
            address: tx.Account,
        });

        expect(instance.Memos).toStrictEqual([
            { MemoData: 'XRP Tip Bot', MemoFormat: undefined, MemoType: 'XrpTipBotNote' },
        ]);

        expect(instance.Fee).toBe('0.000012');

        expect(instance.Date).toBe('2020-09-02T07:24:11.000Z');

        expect(instance.Hash).toBe(tx.hash);
        expect(instance.SigningPubKey).toBe(tx.SigningPubKey);

        expect(instance.LedgerIndex).toBe(tx.ledger_index);
        expect(instance.LastLedgerSequence).toBe(tx.LastLedgerSequence);
        expect(instance.Sequence).toBe(tx.Sequence);

        expect(instance.TransactionResult).toStrictEqual({
            success: true,
            code: 'tesSUCCESS',
            message: undefined,
        });
    });

    it('Should set/get common fields', () => {
        const instance = new BaseTransaction();

        instance.Account = {
            address: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
            tag: 456,
        };
        expect(instance.Account).toStrictEqual({
            tag: 456,
            address: 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY',
        });

        instance.Memos = [Memo.Encode('Memo Description')];
        expect(instance.Memos).toStrictEqual([
            { MemoData: 'Memo Description', MemoFormat: 'text/plain', MemoType: 'Description' },
        ]);

        instance.Fee = '0.000012';
        expect(instance.Fee).toBe('0.000012');

        instance.Hash = '7F10793B5781BD5DD52F70096520321A08DD2ED19AFC7E3F193AAC293954F7DF';
        expect(instance.Hash).toBe('7F10793B5781BD5DD52F70096520321A08DD2ED19AFC7E3F193AAC293954F7DF');

        instance.Sequence = 34306;
        expect(instance.Sequence).toBe(34306);

        instance.LastLedgerSequence = 57913677;
        expect(instance.LastLedgerSequence).toBe(57913677);

        instance.SigningPubKey = '03DF3AB842EB1B57F0A848CD7CC2CFD35F66E4AD0625EEACFFE72A45E4D13E49A';
        expect(instance.SigningPubKey).toBe('03DF3AB842EB1B57F0A848CD7CC2CFD35F66E4AD0625EEACFFE72A45E4D13E49A');
    });

    it('Should return right transaction result', () => {
        const instance = new BaseTransaction();

        // transaction already verified by network
        // @ts-ignore
        instance.meta.TransactionResult = 'tesSUCCESS';

        expect(instance.TransactionResult).toStrictEqual({
            success: true,
            code: 'tesSUCCESS',
            message: undefined,
        });

        // transaction is not verified by network and failed
        // @ts-ignore
        instance.meta.TransactionResult = 'tecNO_LINE_INSUF_RESERVE';

        instance.SubmitResult = {
            success: true,
            engineResult: 'tecNO_LINE_INSUF_RESERVE',
            message: 'No such line. Too little reserve to create it.',
            node: 'wss://xrplcluster.com',
            nodeType: 'Mainnet',
            nodeId: 0,
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
        instance.meta.TransactionResult = undefined;

        instance.SubmitResult = {
            success: false,
            engineResult: 'temBAD_FEE',
            message: 'temBAD_FEE description',
            node: 'wss://xrplcluster.com',
            nodeType: 'Mainnet',
            nodeId: 0,
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
        const address = 'rEAa7TDpBdL1hoRRAp3WDmzBcuQzaXssmb';

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
                networkId: 0,
            }),
        );

        // create a transaction instance for signing
        const { tx, meta } = paymentTemplates.SimplePayment;
        const instance = new BaseTransaction(tx, meta);

        // prepare the transaction by applying the private key
        await instance.prepare(undefined);

        // run test to check if it properly prepared transaction
        expect(instance.Account).toStrictEqual({
            tag: undefined,
            address,
        });

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
        const { tx, meta } = paymentTemplates.SimplePayment;
        const instance = new BaseTransaction(tx, meta);
        instance.LastLedgerSequence = undefined;
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

    it('Should be able to generate the right CTID', () => {
        const { tx, meta } = paymentTemplates.XRP2XRP;
        const instance = new BaseTransaction(tx, meta);
        expect(instance.CTID).toBe('C373B14A00040000');
    });
});
