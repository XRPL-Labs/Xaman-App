/**
 * Base Ledger transaction parser
 */
import BigNumber from 'bignumber.js';
import { set, get, has, isUndefined, find, flatMap } from 'lodash';

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

import Localize from '@locale';

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

    private _SubmitResult?: SubmitResultType;
    private _VerifyResult?: VerifyResultType;

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
            'TicketSequence',
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
            // prepare only for known transaction types types
            if (!this.Type) {
                return;
            }

            // throw error if transaction fee is not set
            // transaction fee's should always been set and shown to user before signing
            if (isUndefined(this.Fee)) {
                throw new Error(Localize.t('global.transactionFeeIsNotSet'));
            }

            // if account sequence not set get the latest account sequence
            if (isUndefined(this.Sequence)) {
                const accountInfo = await LedgerService.getAccountInfo(this.Account.address);

                if (!has(accountInfo, 'error') && has(accountInfo, ['account_data', 'Sequence'])) {
                    const { account_data } = accountInfo;
                    this.Sequence = Number(account_data.Sequence);
                } else {
                    throw new Error(Localize.t('global.unableToSetAccountSequence'));
                }
            }

            // if FullyCanonicalSig is not set, add it
            if (!this.Flags.FullyCanonicalSig) {
                this.Flags = [txFlags.Universal.FullyCanonicalSig];
            }
        } catch (e: any) {
            throw new Error(`Unable to prepare the transaction, ${e?.message}`);
        }
    };

    /**
    Populate transaction LastLedgerSequence
    * @param {number} maxLedgerGap max ledger gap
    * @returns {void}
    */
    populateLastLedgerSequence = (ledgerOffset = 10) => {
        // just for known tx types
        if (!this.Type) {
            return;
        }
        // if no LastLedgerSequence or LastLedgerSequence is already pass the threshold
        // update with LastLedger + 10
        const { LastLedger } = LedgerService.getLedgerStatus();
        // if unable to fetch the LastLedger probably user is not connected to the node
        if (!LastLedger) {
            throw new Error(Localize.t('global.unableToGetLastClosedLedger'));
        }
        // expected LastLedger sequence
        const ExpectedLastLedger = LastLedger + ledgerOffset;
        // if LastLedgerSequence is not set
        if (isUndefined(this.LastLedgerSequence)) {
            // only set if if last ledger is set
            this.LastLedgerSequence = ExpectedLastLedger;
        } else if (this.LastLedgerSequence < 32570) {
            // When a transaction has a Max Ledger property + value and the value < 32570,
            // use the existing Ledger + the entered value at the moment of signing.
            this.LastLedgerSequence = LastLedger + this.LastLedgerSequence;
        } else if (this.LastLedgerSequence < ExpectedLastLedger) {
            // the Last Ledger is already passed, update it base on Last ledger
            this.LastLedgerSequence = ExpectedLastLedger;
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
                if (!account) {
                    reject(new Error('Account param is required!'));
                    return;
                }

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
                // skip if multiSing transaction
                if (!multiSign) {
                    await this.prepare();
                }

                // if transaction aborted then don't continue
                if (this.isAborted) {
                    reject(new Error('Transaction aborted!'));
                    return;
                }

                Navigator.showOverlay(AppScreens.Overlay.Vault, {
                    account,
                    multiSign,
                    transaction: this,
                    onSign: (signedObject: SignedObjectType) => {
                        const { id, signedTransaction, signers } = signedObject;

                        if (!id || !signedTransaction) {
                            reject(new Error('Unable sign the transaction, please try again!'));
                            return;
                        }

                        this.Hash = signedObject.id;
                        this.TxnSignature = signedObject.signedTransaction;
                        this.SignMethod = signedObject.signMethod || 'OTHER';

                        if (Array.isArray(signers) && signers.length > 0) {
                            [this.SignerAccount] = signers;
                        }

                        resolve(this.TxnSignature);
                    },
                    onDismissed: () => {
                        reject();
                    },
                });
            } catch (e) {
                reject(e);
            }
        });
    };

    /*
    Verify the transaction from ledger
    */
    verify = async (): Promise<VerifyResultType> => {
        const verifyResult = await LedgerService.verifyTransaction(this.Hash);

        // assign the new transaction from ledger
        if (has(verifyResult, 'transaction')) {
            const { transaction } = verifyResult;

            this.meta = transaction.meta;
            this.tx = transaction;
        }

        // persist verify result
        this.VerifyResult = { success: verifyResult.success };

        return verifyResult;
    };

    /*
    Submit the signed transaction to the Ledger
    */
    submit = async (): Promise<SubmitResultType> => {
        try {
            // if transaction is not signed exit
            if (!this.TxnSignature) {
                throw new Error('transaction is not signed!');
            }

            // if transaction is already submitted exit
            if (this.SubmitResult) {
                throw new Error('transaction already submitted!');
            }

            // fail transaction locally if AccountDelete
            // do not retry or relay the transaction to other servers
            // this will prevent fee burn if something wrong on AccountDelete transactions
            const shouldFailHard = this.Type === 'AccountDelete';

            // Submit signed transaction to the XRPL
            const submitResult = await LedgerService.submitTransaction(this.TxnSignature, shouldFailHard);

            // update transaction hash base on submit result
            const { transactionId } = submitResult;
            if (transactionId) {
                this.Hash = transactionId;
            }

            // set submit result
            this.SubmitResult = submitResult;

            return submitResult;
        } catch (e: any) {
            // something wrong happened
            const result = {
                success: false,
                engineResult: 'telFAILED',
                message: e?.message,
            };

            // set submit result
            this.SubmitResult = result;

            return result;
        }
    };

    /*
    Abort the transaction if on progress
    this will just set a flag
    */
    abort = () => {
        this.isAborted = true;
    };

    /**
     * Calculate the fee base on transaction type
     * @param {number} netFee in drops
     * @returns {string} calculated fee in drops
     */
    calculateFee = (netFee?: number): string => {
        // if netFee is not set, default to 12 drops
        if (!netFee) {
            netFee = 12;
        }

        let baseFee = new BigNumber(0);

        // netFee × (33 + (Fulfillment size in bytes ÷ 16))
        if (this.Type === 'EscrowFinish' && this.Fulfillment) {
            baseFee = new BigNumber(netFee).multipliedBy(
                // @ts-ignore
                new BigNumber(Buffer.from(this.Fulfillment).length).dividedBy(16).plus(33),
            );
        }

        // AccountDelete transactions require at least the owner reserve amount
        if (this.Type === 'AccountDelete') {
            const { OwnerReserve } = LedgerService.getNetworkReserve();
            baseFee = new BigNumber(OwnerReserve).multipliedBy(1000000);
        }

        // if no changing needs to apply set the net fee as base fee
        if (baseFee.isZero()) {
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

    /**
     * get transaction balance changes
     * @returns changes
     */
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

    /**
     * get transaction balance changes
     * @returns changes
     */
    OwnerCountChange(owner?: string) {
        if (!owner) {
            owner = this.Account.address;
        }

        const change = find(new Meta(this.meta).parseOwnerCountChanges(), { address: owner });

        return change;
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
                type: HexEncoding.toUTF8(m.Memo.MemoType),
                format: HexEncoding.toUTF8(m.Memo.MemoFormat),
                data: HexEncoding.toUTF8(m.Memo.MemoData),
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

    get SubmitResult(): SubmitResultType {
        return get(this, '_SubmitResult', undefined);
    }

    set SubmitResult(result: SubmitResultType) {
        set(this, '_SubmitResult', result);
    }

    get VerifyResult(): VerifyResultType {
        const result = get(this, '_VerifyResult', undefined);

        if (isUndefined(result)) {
            return {
                success: false,
            };
        }

        return result;
    }

    set VerifyResult(result: VerifyResultType) {
        set(this, '_VerifyResult', result);
    }

    get TransactionResult(): TransactionResult {
        const transactionResult = get(this, ['meta', 'TransactionResult'], undefined);

        // this transaction already verified by network
        if (transactionResult === 'tesSUCCESS') {
            return {
                success: true,
                code: transactionResult,
                message: undefined,
            };
        }

        const submitResult = get(this, 'SubmitResult', undefined);
        const verifyResult = get(this, 'VerifyResult', undefined);

        // if already verified by network or
        // submitted result was successful
        // or verify result was successful
        const code = transactionResult || submitResult?.engineResult;
        const success = code === 'tesSUCCESS' || verifyResult?.success;
        const message = !success ? submitResult?.message : undefined;

        return {
            success,
            code,
            message,
        };
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
        const signers = get(this, ['tx', 'Signers']);

        return flatMap(signers, (e) => {
            return { account: e.Signer.Account, signature: e.Signer.TxnSignature, pubKey: e.Signer.SigningPubKey };
        });
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

    get TicketSequence(): number {
        return get(this, ['tx', 'TicketSequence'], undefined);
    }

    set TicketSequence(ticketSequence: number) {
        set(this, ['tx', 'TicketSequence'], ticketSequence);
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
