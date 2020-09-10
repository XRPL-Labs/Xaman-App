/* eslint-disable spellcheck/spell-checker */
/* eslint-disable max-len */

import BaseTransaction from '../base';

import txTemplates from './templates/baseTx.json';
import paymentTxTemplates from './templates/PaymentTx.json';

// mock the ledgerService
import LedgerService from '../../../../../services/LedgerService';

jest.mock('../../../../../services/LedgerService');

describe('BaseTransaction tx', () => {
    it('Should return right parsed values', () => {
        // @ts-ignore
        const instance = new BaseTransaction(txTemplates);

        expect(instance.Account).toStrictEqual({
            tag: 456,
            address: txTemplates.tx.Account,
            name: undefined,
        });

        expect(instance.Memos).toStrictEqual([{ data: 'XRP Tip Bot', format: undefined, type: 'XrpTipBotNote' }]);

        expect(instance.Flags).toStrictEqual({ FullyCanonicalSig: true });

        expect(instance.Fee).toBe('0.000012');

        expect(instance.Date).toBe('2020-09-02T07:24:11.000Z');

        expect(instance.Hash).toBe(txTemplates.tx.hash);
        expect(instance.SigningPubKey).toBe(txTemplates.tx.SigningPubKey);

        expect(instance.LedgerIndex).toBe(txTemplates.tx.ledger_index);
        expect(instance.LastLedgerSequence).toBe(txTemplates.tx.LastLedgerSequence);
        expect(instance.Sequence).toBe(txTemplates.tx.Sequence);

        expect(instance.TransactionResult).toStrictEqual({
            success: true,
            code: 'tesSUCCESS',
            message: undefined,
        });
    });

    it('Should set/get fields', () => {
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

        instance.TransactionResult = {
            success: true,
            code: 'tesSUCCESS',
            message: undefined,
        };
        expect(instance.TransactionResult).toStrictEqual({
            success: true,
            code: 'tesSUCCESS',
            message: undefined,
        });

        instance.Hash = '7F10793B5781BD5DD52F70096520321A08DD2ED19AFC7E3F193AAC293954F7DF';
        expect(instance.Hash).toBe('7F10793B5781BD5DD52F70096520321A08DD2ED19AFC7E3F193AAC293954F7DF');

        instance.Sequence = 34306;
        expect(instance.Sequence).toBe(34306);

        instance.LastLedgerSequence = 57913677;
        expect(instance.LastLedgerSequence).toBe(57913677);

        instance.SigningPubKey = '03DF3AB842EB1B57F0A848CD7CC2CFD35F66E4AD0625EEACFFE72A45E4D13E49A';
        expect(instance.SigningPubKey).toBe('03DF3AB842EB1B57F0A848CD7CC2CFD35F66E4AD0625EEACFFE72A45E4D13E49A');
    });

    it('Should be able to prepare the transaction for signing', async () => {
        const address = 'rEAa7TDpBdL1hoRRAp3WDmzBcuQzaXssmb';
        const privateKey = '00368093D69FF1CFCA380EEE8D3B100CD201C079E2BDBE66016497C1CD2501A0FB';

        // mock the ledger service response
        const spy = jest.spyOn(LedgerService, 'getAccountInfo').mockImplementation(() => {
            return {
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
            };
        });

        // create a transaction instance for signing
        const instance = new BaseTransaction(paymentTxTemplates.SimplePayment);

        // prepare the transaction by applying the private key
        await instance.prepare(privateKey);

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

        // should set the LastLedgerSequence if lower than 32570
        expect(instance.LastLedgerSequence).toBe(6032000);

        // should sign the transaciton successfully
        await instance.sign();

        expect(instance.Hash).toBe('F5E86A597423C05ECF9176C81BA2EA8B6C0FF5A8B2C4E42FF82245DA24947D31');
        expect(instance.SignedTX).toBeDefined();

        spy.mockRestore();
    });
});
