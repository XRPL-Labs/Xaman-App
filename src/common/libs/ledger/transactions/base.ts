/**
 * Base Ledger transaction parser
 */
import BigNumber from 'bignumber.js';
import { set, get, has, isUndefined, find } from 'lodash';

import LedgerService from '@services/LedgerService';

import { AccountSchema } from '@store/schemas/latest';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import { HexEncoding } from '@common/utils/string';
import {
    SignedObjectType,
    TransactionJSONType,
    LedgerTransactionType,
    SubmitResultType,
    VerifyResultType,
} from '@common/libs/ledger/types';

import Meta from '../parser/meta';
import LedgerDate from '../parser/common/date';
import Amount from '../parser/common/amount';
import Flag from '../parser/common/flag';
import { txFlags } from '../parser/common/flags/txFlags';

/* Types ==================================================================== */
import { TransactionResult, Account, Memo, AmountType } from '../parser/types';

/* Class ==================================================================== */
class BaseTransaction {
    [key: string]: any;

    constructor(_transaction?: LedgerTransactionType) {
        if (!isUndefined(_transaction)) {
            const { transaction, tx, meta } = _transaction;
            this.meta = meta;
            this.tx = transaction || tx || _transaction;
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

        this.ClassName = 'Transaction';
    }

    /**
    Preprare the transaction for signing
    * @returns {Promise<void>}
    */
    prepare = async () => {
        try {
            // if fee not set then get current network fee
            // just for known tx types
            if (this.Type) {
                if (isUndefined(this.Fee)) {
                    const { Fee } = LedgerService.getLedgerStatus();

                    if (Fee) {
                        this.Fee = new Amount(this.calculateFee(Fee)).dropsToXrp();
                    } else {
                        throw new Error('Unable to set transaction Fee, check you are connected to the internet.');
                    }
                }

                // if account sequence not set get the latest account sequence
                if (isUndefined(this.Sequence)) {
                    const accountInfo = await LedgerService.getAccountInfo(this.Account.address);

                    if (!has(accountInfo, 'error') && has(accountInfo, ['account_data', 'Sequence'])) {
                        const { account_data } = accountInfo;
                        this.Sequence = Number(account_data.Sequence);
                    } else {
                        throw new Error('Unable to set account Sequence, check you are connected to the internet.');
                    }
                }

                // When a transaction has a Max Ledger property + value and the value < 32570,
                // use the existing Ledger + the entered value at the moment of signing.
                if (this.LastLedgerSequence) {
                    if (this.LastLedgerSequence < 32570) {
                        const { LastLedger } = LedgerService.getLedgerStatus();
                        if (LastLedger) {
                            this.LastLedgerSequence = Number(LastLedger) + this.LastLedgerSequence;
                        }
                    }
                }

                // if FullyCanonicalSig is not set, add it
                if (!this.Flags.FullyCanonicalSig) {
                    this.Flags = [txFlags.Universal.FullyCanonicalSig];
                }
            }
        } catch (e) {
            throw new Error(`Unable to prepare the transaction, ${e?.message}`);
        }
    };

    /**
    Sign the transaction with provided account
    * @param {AccountSchema} account object sign with
    * @param {bool} multiSign indicates if transaction should sign for multi signing
    * @returns {Promise<string>} signed tx blob
    */
    sign = (account: AccountSchema, multiSign = false): Promise<string> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                if (this.TxnSignature) {
                    reject(new Error('Transaction already signed!'));
                    return;
                }

                // if account not set , set the signing account
                if (isUndefined(this.Account)) {
                    this.Account = {
                        address: account.address,
                    };
                }

                // prepare tranaction for signing
                await this.prepare();

                Navigator.showOverlay(
                    AppScreens.Overlay.Vault,
                    {
                        overlay: {
                            handleKeyboardEvents: true,
                        },
                        layout: {
                            backgroundColor: 'transparent',
                            componentBackgroundColor: 'transparent',
                        },
                    },
                    {
                        account,
                        txJson: this.Json,
                        multiSign,
                        onSign: (signedObject: SignedObjectType) => {
                            const { id, signedTransaction } = signedObject;

                            if (!id || !signedTransaction) {
                                reject(new Error('Unable sign the transaction, please try again!'));
                                return;
                            }

                            this.Hash = signedObject.id;
                            this.TxnSignature = signedObject.signedTransaction;
                            this.SignMethod = signedObject.signMethod || 'OTHER';

                            resolve(this.TxnSignature);
                        },
                        onDismissed: () => {
                            reject();
                        },
                    },
                );
            } catch (e) {
                reject(e);
            }
        });
    };

    /*
    Verify the transaction from ledger
    */
    verify = async (): Promise<VerifyResultType> => {
        const verifyResult = await LedgerService.verifyTx(this.Hash);

        // assign the new transaction from ledger
        if (has(verifyResult, 'transaction')) {
            const { transaction } = verifyResult;

            this.meta = transaction.meta;
            this.tx = transaction;
        }

        return verifyResult;
    };

    /*
    Submit the signed transaction to the Ledger
    */
    submit = async (account?: AccountSchema, multiSign?: boolean): Promise<SubmitResultType> => {
        try {
            // if not signed trigger sing function
            if (!this.TxnSignature) {
                await this.sign(account, multiSign);
            }

            const submitResult = await LedgerService.submitTX(this.TxnSignature);

            const { engineResult, message, success, transactionId } = submitResult;

            if (transactionId) {
                this.Hash = transactionId;
            }

            // temporary set the result
            this.TransactionResult = {
                code: engineResult,
                message,
                success,
            };

            return submitResult;
        } catch (e) {
            // something wrong happened
            // temporary set the result
            this.TransactionResult = {
                code: 'telFAILED',
                message: e?.message,
                success: false,
            };

            return {
                success: false,
                engineResult: 'telFAILED',
                message: e?.message,
            };
        }
    };

    /**
     * Calculate the fee base on transaction type
     * @param {number} netFee in drops
     * @returns {string} calculated fee in drops
     */
    calculateFee = (netFee?: number): string => {
        let baseFee;

        // if netFee is not set, default to 12 drops
        if (!netFee) {
            netFee = 12;
        }

        // 10 drops × (33 + (Fulfillment size in bytes ÷ 16))
        // @ts-ignore
        if (this.Type === 'EscrowFinish' && this.Fulfillment) {
            baseFee = new BigNumber(netFee).multipliedBy(
                // @ts-ignore
                new BigNumber(Buffer.from(this.Fulfillment).length).dividedBy(16).plus(33),
            );
        }

        if (this.Type === 'AccountDelete') {
            baseFee = new BigNumber(5).multipliedBy(1000000);
        }
        // 10 drops × (1 + Number of Signatures Provided)
        if (this.Signers.length > 0) {
            baseFee = new BigNumber(this.Signers.length).plus(1).multipliedBy(netFee).plus(baseFee);
        }

        if (!baseFee) {
            baseFee = new BigNumber(netFee);
        }

        return baseFee.toFixed(0, BigNumber.ROUND_UP);
    };

    /**
     * check if transaction contain any xApp identifier and return it
     * @returns {string} xApp identifier if found any
     */
    getXappIdentifier(): string {
        const memos = this.Memos;
        if (!memos) return undefined;

        for (const memo of memos) {
            if (memo.type === 'xumm/xapp' && memo.data) {
                return memo.data;
            }
        }

        return undefined;
    }

    BalanceChange(owner?: string) {
        if (!owner) {
            owner = this.Account.address;
        }

        const balanceChanges = get(new Meta(this.meta).parseBalanceChanges(), owner);

        const changes = {
            sent: find(balanceChanges, (o) => o.action === 'DEC'),
            received: find(balanceChanges, (o) => o.action === 'INC'),
        } as { sent: AmountType; received: AmountType };

        // remove fee from sender
        if (owner === this.Account.address && changes.sent && changes.sent.currency === 'XRP') {
            const afterFee = new BigNumber(changes.sent.value).minus(new BigNumber(this.Fee));
            if (afterFee.isZero()) {
                set(changes, 'sent', undefined);
            } else {
                set(changes, 'sent.value', afterFee.decimalPlaces(8).toString(10));
            }
        }

        return changes;
    }

    get Type(): string {
        return get(this, ['tx', 'TransactionType'], undefined);
    }

    set Type(type: string) {
        set(this, ['tx', 'TransactionType'], type);
    }

    get Account(): Account {
        const source = get(this, ['tx', 'Account'], undefined);
        const sourceTag = get(this, ['tx', 'SourceTag'], undefined);
        const sourceName = get(this, ['tx', 'AccountName'], undefined);

        if (isUndefined(source)) return undefined;

        return {
            name: sourceName,
            address: source,
            tag: sourceTag,
        };
    }

    set Account(account: Account) {
        if (has(account, 'address')) {
            set(this, 'tx.Account', account.address);
        }
        if (has(account, 'name')) {
            set(this, 'tx.AccountName', account.name);
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
                        MemoType: m.type && HexEncoding.toHex(m.type).toUpperCase(),
                        MemoFormat: m.format && HexEncoding.toHex(m.format).toUpperCase(),
                        MemoData: m.data && HexEncoding.toHex(m.data).toUpperCase(),
                    },
                };
            });
        }

        set(this, ['tx', 'Memos'], encodedMemos || []);
    }

    get Flags(): any {
        const intFlags = get(this, ['tx', 'Flags'], undefined);
        const flagParser = new Flag(this.Type, intFlags);
        return flagParser.parse();
    }

    set Flags(flags: any) {
        const intFlags = get(this, ['tx', 'Flags'], undefined);
        const flagParser = new Flag(this.Type, intFlags);

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
            success: engine_result === 'tesSUCCESS',
            code: engine_result,
            message,
        };
    }

    set TransactionResult(result: TransactionResult) {
        set(this, ['meta', 'TransactionResult'], result.code);
        set(this, ['meta', 'TransactionResultMessage'], result?.message);
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

    get Sequence(): number {
        return get(this, ['tx', 'Sequence'], undefined);
    }

    set Sequence(sequence: number) {
        set(this, ['tx', 'Sequence'], sequence);
    }

    get LastLedgerSequence(): number {
        return get(this, ['tx', 'LastLedgerSequence'], undefined);
    }

    set LastLedgerSequence(ledgerSequence: number) {
        set(this, ['tx', 'LastLedgerSequence'], ledgerSequence);
    }

    set PreviousTxnID(id: string) {
        set(this, ['tx', 'PreviousTxnID'], id);
    }

    get PreviousTxnID(): string {
        return get(this, ['tx', 'PreviousTxnID'], undefined);
    }

    set TxnSignature(signature: string) {
        set(this, ['tx', 'TxnSignature'], signature);
    }

    get TxnSignature(): string {
        return get(this, ['tx', 'TxnSignature'], undefined);
    }
}

/* Export ==================================================================== */
export default BaseTransaction;
