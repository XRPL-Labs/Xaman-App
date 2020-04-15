/**
 * Base Ledger transaction parser
 */
import BigNumber from 'bignumber.js';

import { set, get, has, isUndefined } from 'lodash';

import { HexEncoding } from '@common/libs/utils';
import Amount from '../parser/common/amount';

import Flag from '../parser/common/flag';
import LedgerDate from '../parser/common/date';

import Submitter from '../submitter';

/* Types ==================================================================== */
import { TransactionResult, Account, Memo } from '../parser/types';
import { TransactionJSONType, LedgerTransactionType, SubmitResultType, VerifyResultType } from '../types';

/* Class ==================================================================== */
class BaseTransaction {
    [key: string]: any;

    constructor(_transaction?: LedgerTransactionType) {
        if (!isUndefined(_transaction)) {
            const { transaction, tx, meta } = _transaction;
            this.meta = meta;
            this.tx = transaction || tx;
        } else {
            this.meta = {};
            this.tx = {};
        }

        this.fields = [
            'TransactionType',
            'Account',
            'Memos',
            'Flags',
            'Fee',
            'Sequence',
            'AccountTxnID',
            'LastLedgerSequence',
            'Signers',
            'SourceTag',
            'SigningPubKey',
            'TxnSignature',
        ];
        this.requiredFields = [];
    }

    /*
    Verify the transaction from ledger
    */
    verify = async (): Promise<VerifyResultType> => {
        const verifyResult = await Submitter.verify(this.Hash);

        // assign the new transaction from ledger
        if (has(verifyResult, 'transaction')) {
            const { transaction } = verifyResult;

            this.meta = transaction.meta;
            this.tx = transaction;
        }

        return verifyResult;
    };

    /*
    Submit the transaction to the Ledger
    */
    submit = async (privateKey: string): Promise<SubmitResultType> => {
        // don't submit tx if it's already have transaction result
        if (this.TransactionResult) {
            throw new Error('transaction already submitted!');
        }
        const ledgerSubmitter = new Submitter(this.Json, privateKey);
        const submitResult = await ledgerSubmitter.submit();

        const { engineResult, message, success, transactionId } = submitResult;

        if (success) {
            this.Hash = transactionId;
        }

        // temporary set the result
        this.TransactionResult = {
            code: engineResult,
            message,
            success,
        };

        return submitResult;
    };

    calculateFee = (netFee: number) => {
        let baseFee;
        // 10 drops × (33 + (Fulfillment size in bytes ÷ 16))
        if (this.Type === 'EscrowFinish' && this.Fulfillment) {
            baseFee = new BigNumber(netFee).multipliedBy(
                new BigNumber(Buffer.from(this.Fulfillment).length).dividedBy(16).plus(33),
            );
        }

        if (this.Type === 'AccountDelete') {
            baseFee = new BigNumber(5).multipliedBy(1000000);
        }
        // 10 drops × (1 + Number of Signatures Provided)
        if (this.Signers.length > 0) {
            baseFee = new BigNumber(this.Signers.length)
                .plus(1)
                .multipliedBy(netFee)
                .plus(baseFee);
        }

        if (!baseFee) {
            baseFee = new BigNumber(netFee);
        }

        return baseFee.toFixed(0, BigNumber.ROUND_UP);
    };

    get Type(): string {
        return get(this, ['tx', 'TransactionType'], undefined);
    }

    set Type(type: string) {
        set(this, ['tx', 'TransactionType'], type);
    }

    get Account(): Account {
        const source = get(this, ['tx', 'Account'], undefined);
        const sourceTag = get(this, ['tx', 'SourceTag'], undefined);
        const sourceName = get(this, ['tx', 'AccountLabel'], undefined);

        if (isUndefined(source)) return undefined;

        return {
            name: sourceName,
            address: source,
            tag: sourceTag,
        };
    }

    set Account(account: Account) {
        set(this, 'tx.Account', account.address);
        if (has(account, 'name')) {
            set(this, 'tx.AccountLabel', account.name);
        }
        if (has(account, 'tag')) {
            set(this, 'tx.SourceTag', account.tag);
        }
    }

    get Memos(): Array<Memo> | undefined {
        const memos = get(this, ['tx', 'Memos'], undefined);

        if (isUndefined(memos)) return undefined;

        if (!Array.isArray(memos) || memos.length === 0) {
            return undefined;
        }
        return memos.map((m: any) => {
            return {
                type: m.Memo.parsed_memo_type || HexEncoding.toString(m.Memo.MemoType),
                format: m.Memo.parsed_memo_format || HexEncoding.toString(m.Memo.MemoFormat),
                data: m.Memo.parsed_memo_data || HexEncoding.toString(m.Memo.MemoData),
            };
        });
    }

    set Memos(memos: Array<Memo>) {
        let encodedMemos;

        if (memos.length > 0) {
            encodedMemos = memos.map((m: any) => {
                return {
                    Memo: {
                        MemoType: HexEncoding.toHex(m.type).toUpperCase(),
                        MemoFormat: HexEncoding.toHex(m.format).toUpperCase(),
                        MemoData: HexEncoding.toHex(m.data).toUpperCase(),
                    },
                };
            });
        }

        set(this, ['tx', 'Memos'], encodedMemos || []);
    }

    get Flags(): any {
        const intFlags = get(this, ['tx', 'Flags'], undefined);
        if (isUndefined(intFlags)) return undefined;
        const flagParser = new Flag(this.Type, intFlags);
        return flagParser.parse();
    }

    // TODO: implement set flags method
    set Flags(flags: any) {
        const flagParser = new Flag(this.Type);

        flags.forEach((f: any) => {
            flagParser.set(f);
        });
        set(this, ['tx', 'Flags'], flagParser.get());
    }

    set Fee(fee: string) {
        set(this, ['tx', 'Fee'], new Amount(fee, false).xrpToDrops());
    }

    get Fee(): string {
        const fee = get(this, ['tx', 'Fee'], undefined);
        if (isUndefined(fee)) return undefined;
        return new Amount(fee).dropsToXrp();
    }

    get Date(): any {
        const date = get(this, ['tx', 'date'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get TransactionResult(): TransactionResult {
        const engine_result = get(this, ['meta', 'TransactionResult']);
        const message = get(this, ['meta', 'TransactionResultMessage']);

        if (!engine_result) {
            return undefined;
        }

        return {
            success: engine_result === 'tesSUCCESS' || engine_result === 'terQUEUED',
            code: engine_result,
            message,
        };
    }

    set TransactionResult(result: TransactionResult) {
        set(this, ['meta', 'TransactionResult'], result.code);
        set(this, ['meta', 'TransactionResultMessage'], result.message);
    }

    get Hash(): string {
        return get(this, ['tx', 'hash']);
    }

    set Hash(transactionId: string) {
        set(this, ['tx', 'hash'], transactionId);
    }

    get LedgerIndex(): number {
        return get(this, ['tx', 'ledger_index']);
    }

    // serialize transaction object to rippled tx json
    get Json(): TransactionJSONType {
        // shallow copy
        const tx = { ...this.tx };
        Object.getOwnPropertyNames(this.tx).forEach((k: string) => {
            if (!this.fields.includes(k)) {
                delete tx[k];
            }
        });

        return tx;
    }

    get Signers(): Array<any> {
        return get(this, ['tx', 'Signers'], []);
    }

    set Signers(signers: Array<any>) {
        set(this, ['tx', 'Signers'], signers);
    }

    get SigningPubKey(): string {
        return get(this, ['tx', 'SigningPubKey']);
    }

    set SigningPubKey(signingPubKey: string) {
        set(this, ['tx', 'SigningPubKey'], signingPubKey);
    }
}

/* Export ==================================================================== */
export default BaseTransaction;
