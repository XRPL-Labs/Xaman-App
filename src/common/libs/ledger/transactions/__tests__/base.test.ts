/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import LedgerService from '@services/LedgerService';
import BaseTransaction from '../base';

import txTemplates from './templates/BaseTx.json';
import paymentTemplates from './templates/PaymentTx.json';

// mock the ledgerService

jest.mock('../../../../../services/LedgerService');

describe('BaseTransaction tx', () => {
    it('Should return right parsed values', () => {
        const { tx, meta } = txTemplates;

        const instance = new BaseTransaction(tx, meta);

        expect(instance.Account).toStrictEqual({
            tag: 456,
            address: tx.Account,
            name: undefined,
        });

        expect(instance.Memos).toStrictEqual([{ data: 'XRP Tip Bot', format: undefined, type: 'XrpTipBotNote' }]);

        expect(instance.Flags).toStrictEqual({ FullyCanonicalSig: true });

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
            name: undefined,
        });

        instance.Memos = [{ data: 'XRP Tip Bot', format: 'text/plain', type: 'XrpTipBotNote' }];
        expect(instance.Memos).toStrictEqual([{ data: 'XRP Tip Bot', format: 'text/plain', type: 'XrpTipBotNote' }]);

        instance.Flags = [0x80000000];
        expect(instance.Flags).toStrictEqual({ FullyCanonicalSig: true });

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

        // transaction already veriffied by network
        instance.meta.TransactionResult = 'tesSUCCESS';

        expect(instance.TransactionResult).toStrictEqual({
            success: true,
            code: 'tesSUCCESS',
            message: undefined,
        });

        // transaction is not veriffied by network and failed
        instance.meta.TransactionResult = 'tecNO_LINE_INSUF_RESERVE';

        instance.SubmitResult = {
            success: true,
            engineResult: 'tecNO_LINE_INSUF_RESERVE',
            message: 'No such line. Too little reserve to create it.',
        };

        instance.VerifyResult = {
            success: false,
        };

        expect(instance.TransactionResult).toStrictEqual({
            success: false,
            code: 'tecNO_LINE_INSUF_RESERVE',
            message: 'No such line. Too little reserve to create it.',
        });

        // transaction is not veriffied by network and hard failed
        instance.meta.TransactionResult = undefined;

        instance.SubmitResult = {
            success: false,
            engineResult: 'temBAD_FEE',
            message: 'temBAD_FEE description',
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
                    address,
                    Balance: '49507625423',
                    Domain: '787270746970626F742E636F6D',
                    EmailHash: '833237B8665D2F4E00135E8DE646589F',
                    Flags: 131072,
                    LedgerEntryType: 'AccountRoot',
                    OwnerCount: 1135,
                    PreviousTxnID: '48DB4C987EDE802030089C48F27FF7A0F589EBA7C3A9F90873AA030D5960F149',
                    PreviousTxnLgrSeq: 58057100,
                    Sequence: 34321,
                    index: '44EF183C00DFCB5DAF505684AA7967C83F42C085EBA6B271E5349CB12C3D5965',
                    // @ts-ignore
                    signer_lists: [],
                    urlgravatar: 'http://www.gravatar.com/avatar/833237b8665d2f4e00135e8de646589f',
                },
            }),
        );

        // create a transaction instance for signing
        const { tx, meta } = paymentTemplates.SimplePayment;
        const instance = new BaseTransaction(tx, meta);

        // prepare the transaction by applying the private key
        await instance.prepare();

        // run test to check if it probebely prepared transaction
        expect(instance.Account).toStrictEqual({
            tag: undefined,
            address,
            name: undefined,
        });

        // should set the sequence number
        expect(instance.Sequence).toBe(34321);

        // should set the FullyCanonicalSig if not set
        expect(instance.Flags).toStrictEqual({
            FullyCanonicalSig: true,
            LimitQuality: false,
            NoRippleDirect: false,
            PartialPayment: false,
        });

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
        instance.populateLastLedgerSequence();
        expect(instance.LastLedgerSequence).toBe(LastLedger + 10);

        // should update LastLedgerSequence if sequence is passed
        instance.LastLedgerSequence = LastLedger - 500;
        instance.populateLastLedgerSequence();
        expect(instance.LastLedgerSequence).toBe(LastLedger + 10);

        // should update LastLedgerSequence if sequence is less than 32570
        instance.LastLedgerSequence = 50;
        instance.populateLastLedgerSequence();
        expect(instance.LastLedgerSequence).toBe(LastLedger + 50);

        spy.mockRestore();
    });
});
