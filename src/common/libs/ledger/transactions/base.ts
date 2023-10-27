/**
 * Base Ledger transaction parser
 */
import BigNumber from 'bignumber.js';
import { filter, find, flatMap, get, has, isUndefined, remove, set, size } from 'lodash';

import LedgerService from '@services/LedgerService';
import NetworkService from '@services/NetworkService';

import { AccountModel } from '@store/models';

import Localize from '@locale';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import { EncodeCTID } from '@common/utils/codec';

import {
    SignedObjectType,
    SubmitResultType,
    TransactionJSONType,
    TransactionTypes,
    VerifyResultType,
} from '@common/libs/ledger/types';

import Meta from '../parser/meta';
import LedgerDate from '../parser/common/date';
import Amount from '../parser/common/amount';
import Flag from '../parser/common/flag';
import Memo from '../parser/common/memo';

/* Types ==================================================================== */
import { Account, AmountType, MemoType, TransactionResult } from '../parser/types';
import { StringTypeCheck } from '@common/utils/string';

/* Class ==================================================================== */
class BaseTransaction {
    protected tx: TransactionJSONType;
    protected meta: any;
    protected fields: string[];

    private submitResult?: SubmitResultType;
    private verifyResult?: VerifyResultType;
    private isAborted: boolean;
    private isSubmitted: boolean;
    private balanceChanges: Map<string, any>;
    private ownerCountChanges: Map<string, any>;

    public SignedBlob: string;
    public SignerPubKey: string;
    public SignMethod: 'PIN' | 'BIOMETRIC' | 'PASSPHRASE' | 'TANGEM' | 'OTHER';
    public SignerAccount: any;

    validate?: () => Promise<void>;

    constructor(tx?: TransactionJSONType, meta?: any) {
        if (!isUndefined(tx)) {
            this.tx = tx;
            this.meta = meta;
        } else {
            this.tx = {};
            this.meta = {};
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
            'NetworkID',
            'HookParameters',
            'OperationLimit',
        ];

        // memorize balance and owner count changes
        this.balanceChanges = new Map();
        this.ownerCountChanges = new Map();
    }

    /**
     Prepare the transaction for signing, including setting the account sequence
     * @returns {Promise<void>}
     */
    prepare = async (account: AccountModel) => {
        // ignore for pseudo transactions
        if (this.isPseudoTransaction()) {
            return;
        }

        // throw error if transaction fee is not set
        // transaction fee's should always been set and shown to user before signing
        if (isUndefined(this.Fee)) {
            throw new Error(Localize.t('global.transactionFeeIsNotSet'));
        }

        // if account sequence not set get the latest account sequence
        if (isUndefined(this.Sequence)) {
            try {
                this.Sequence = await LedgerService.getAccountSequence(this.Account.address);
            } catch {
                throw new Error(Localize.t('global.unableToSetAccountSequence'));
            }
        }

        // if PaymentChannelCrate and PublicKey is not set, set the signing account public key
        // @ts-ignore
        if (this.TransactionType === TransactionTypes.PaymentChannelCreate && isUndefined(this.PublicKey)) {
            // @ts-ignore
            this.PublicKey = account.publicKey;
        }
    };

    /**
     Populate transaction LastLedgerSequence
     * @param {number} ledgerOffset max ledger gap
     * @returns {void}
     */
    populateFields = ({ lastLedgerOffset }: { lastLedgerOffset?: number } = {}): void => {
        // ignore for pseudo transactions
        if (this.isPseudoTransaction()) {
            return;
        }

        // NOTE: as tangem signing can take a lot of time we increase gap to 150 ledger
        // offset default to 10
        const LastLedgerOffset = lastLedgerOffset || 10;

        // if no LastLedgerSequence or LastLedgerSequence is already pass the threshold
        // update with LastLedger + 10
        const { LastLedger } = LedgerService.getLedgerStatus();
        // if unable to fetch the LastLedger probably user is not connected to the node
        if (!LastLedger) {
            throw new Error(Localize.t('global.unableToGetLastClosedLedger'));
        }
        // expected LastLedger sequence
        const ExpectedLastLedger = LastLedger + LastLedgerOffset;

        // if LastLedgerSequence is not set
        if (isUndefined(this.LastLedgerSequence)) {
            // only set if last ledger is set
            this.LastLedgerSequence = ExpectedLastLedger;
        } else if (this.LastLedgerSequence < 32570) {
            // When a transaction has a Max Ledger property + value and the value < 32570,
            // use the existing Ledger + the entered value at the moment of signing.
            this.LastLedgerSequence = LastLedger + this.LastLedgerSequence;
        } else if (this.LastLedgerSequence < ExpectedLastLedger) {
            // the Last Ledger is already passed, update it base on Last ledger
            this.LastLedgerSequence = ExpectedLastLedger;
        }

        // check if we need to populate NetworkID
        if (isUndefined(this.NetworkID)) {
            // get current network definitions
            const definitions = NetworkService.getNetworkDefinitions();
            if (typeof definitions?.field === 'object' && find(definitions.field, { name: 'NetworkID' })) {
                this.NetworkID = NetworkService.getNetworkId();
            }
        }
    };

    /**
     Sign the transaction with provided account
     * @param {AccountModel} account object sign with
     * @param multiSign
     * @returns {Promise<string>} signed tx blob
     */
    sign = (account: AccountModel, multiSign = false): Promise<string> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                // account params should be provided
                if (!account) {
                    reject(new Error('Account param is required!'));
                    return;
                }

                // transaction is already been signed?
                if (this.SignedBlob) {
                    reject(new Error('Transaction already been signed!'));
                    return;
                }

                // check transaction can be signed by the network user is connected with before triggering the sign flow
                const definitions = NetworkService.getNetworkDefinitions();

                if (
                    Array.isArray(definitions.transactionNames) &&
                    !definitions.transactionNames.includes(this.TransactionType)
                ) {
                    reject(
                        new Error(
                            `Your current connected network doesn't support "${this.TransactionType}" transaction. Please switch to a compatible network.`,
                        ),
                    );
                    return;
                }

                // if account not set , set the signing account
                if (isUndefined(this.Account)) {
                    this.Account = {
                        address: account.address,
                    };
                }

                // prepare transaction for signing
                // skip if multiSing transaction
                if (!multiSign) {
                    await this.prepare(account);
                }

                // if transaction aborted then don't continue
                if (this.isAborted) {
                    reject(new Error('Transaction aborted!'));
                    return;
                }

                // show vault overlay and handle the reset of signing
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
                        this.SignedBlob = signedObject.signedTransaction;
                        this.SignMethod = signedObject.signMethod || 'OTHER';
                        this.SignerPubKey = signedObject.signerPubKey;

                        if (Array.isArray(signers) && signers.length > 0) {
                            [this.SignerAccount] = signers;
                        }

                        resolve(this.SignedBlob);
                    },
                    onDismissed: reject,
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
            if (!this.SignedBlob) {
                throw new Error('transaction is not signed!');
            }

            // if transaction is already submitted exit
            if (this.SubmitResult || this.isSubmitted) {
                throw new Error('transaction is in submitting phase or has been submitted to the ledger!');
            }

            // if transaction aborted then don't continue
            if (this.isAborted) {
                throw new Error('Transaction aborted!');
            }

            // set isSubmitted to true for preventing the transaction to be submitted multiple times
            this.isSubmitted = true;

            // fail transaction locally if AccountDelete
            // do not retry or relay the transaction to other servers
            // this will prevent fee burn if something wrong on AccountDelete transactions
            const shouldFailHard = this.TransactionType === TransactionTypes.AccountDelete;

            // Submit signed transaction to the Ledger
            const submitResult = await LedgerService.submitTransaction(this.SignedBlob, this.Hash, shouldFailHard);

            // set submit result
            this.SubmitResult = submitResult;

            return submitResult;
        } catch (e: any) {
            // something wrong happened
            const result = {
                success: false,
                engineResult: 'telFAILED',
                message: e?.message,
                network: {
                    id: undefined,
                    node: undefined,
                    key: undefined,
                    type: undefined,
                },
            } as SubmitResultType;

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
    calculateFee = (netFee?: number | string): string => {
        // if netFee is not set, default to 12 drops
        if (!netFee) {
            netFee = 12;
        }

        let baseFee = new BigNumber(0);

        // netFee × (33 + (Fulfillment size in bytes ÷ 16))
        // @ts-ignore
        if (this.TransactionType === TransactionTypes.EscrowFinish && this.Fulfillment) {
            baseFee = new BigNumber(netFee).multipliedBy(
                // @ts-ignore
                new BigNumber(Buffer.from(this.Fulfillment).length).dividedBy(16).plus(33),
            );
        }

        // AccountDelete transactions require at least the owner reserve amount
        if (this.TransactionType === TransactionTypes.AccountDelete) {
            const { OwnerReserve } = NetworkService.getNetworkReserve();
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
            if (
                ['xumm/xapp', 'xaman/xapp'].includes(memo.MemoType) &&
                StringTypeCheck.isValidXAppIdentifier(memo.MemoData)
            ) {
                return memo.MemoData;
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

        // if already calculated return value
        if (this.balanceChanges.has(owner)) {
            return this.balanceChanges.get(owner);
        }

        const balanceChanges = get(new Meta(this.meta).parseBalanceChanges(), owner);

        // if cross currency remove fee from changes
        if (size(filter(balanceChanges, { action: 'DEC' })) > 1) {
            const decreaseNative = find(balanceChanges, { action: 'DEC', currency: NetworkService.getNativeAsset() });
            if (decreaseNative.value === this.Fee) {
                remove(balanceChanges, { action: 'DEC', currency: NetworkService.getNativeAsset() });
            }
        }

        const changes = {
            sent: find(balanceChanges, (o) => o.action === 'DEC'),
            received: find(balanceChanges, (o) => o.action === 'INC'),
        } as { sent: AmountType; received: AmountType };

        // remove fee from transaction owner balance changes
        // this should apply for NFTokenAcceptOffer and OfferCreate transactions as well
        let feeFieldKey = undefined as 'sent' | 'received';
        if (owner === this.Account.address) {
            if (changes.sent?.currency === NetworkService.getNativeAsset()) {
                feeFieldKey = 'sent';
            } else if (
                [TransactionTypes.NFTokenAcceptOffer, TransactionTypes.OfferCreate].includes(this.TransactionType) &&
                changes.received?.currency === NetworkService.getNativeAsset()
            ) {
                feeFieldKey = 'received';
            }
        }

        if (feeFieldKey) {
            const afterFee = new BigNumber(changes[feeFieldKey].value).minus(new BigNumber(this.Fee));
            if (afterFee.isZero()) {
                set(changes, feeFieldKey, undefined);
            } else if (
                afterFee.isNegative() &&
                this.TransactionType === TransactionTypes.NFTokenAcceptOffer &&
                feeFieldKey === 'sent'
            ) {
                set(changes, 'sent', undefined);
                set(changes, 'received', {
                    currency: NetworkService.getNativeAsset(),
                    value: afterFee.absoluteValue().decimalPlaces(8).toString(10),
                });
            } else {
                set(changes, [feeFieldKey, 'value'], afterFee.decimalPlaces(8).toString(10));
            }
        }

        // memorize the changes for this account
        this.balanceChanges.set(owner, changes);

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

        // if value is already set return
        if (this.ownerCountChanges.has(owner)) {
            return this.ownerCountChanges.get(owner);
        }

        const ownerChanges = find(new Meta(this.meta).parseOwnerCountChanges(), { address: owner });

        // memorize owner count changes
        this.ownerCountChanges.set(owner, ownerChanges);

        return ownerChanges;
    }

    /**
     * check if transaction is a Pseudo transaction
     * @returns boolean
     */
    isPseudoTransaction(): boolean {
        return isUndefined(this.TransactionType);
    }

    get TransactionType(): TransactionTypes {
        return get(this, ['tx', 'TransactionType'], undefined);
    }

    set TransactionType(type: TransactionTypes) {
        set(this, ['tx', 'TransactionType'], type);
    }

    get Account(): Account {
        const source = get(this, ['tx', 'Account'], undefined);
        const sourceTag = get(this, ['tx', 'SourceTag'], undefined);

        if (isUndefined(source)) return undefined;

        return {
            address: source,
            tag: sourceTag,
        };
    }

    set Account(account: Account) {
        if (has(account, 'address')) {
            set(this, 'tx.Account', account.address);
        }
        if (has(account, 'tag')) {
            set(this, 'tx.SourceTag', account.tag);
        }
    }

    get Memos(): Array<MemoType> | undefined {
        const memos = get(this, ['tx', 'Memos'], undefined);

        if (isUndefined(memos)) return undefined;

        if (!Array.isArray(memos) || memos.length === 0) {
            return undefined;
        }

        return memos.map((m) => Memo.Decode(m.Memo));
    }

    set Memos(memos: Array<MemoType>) {
        const encodedMemos = memos.map((m) => {
            return {
                Memo: m,
            };
        });

        set(this, ['tx', 'Memos'], encodedMemos);
    }

    get Flags(): any {
        const intFlags = get(this, ['tx', 'Flags'], undefined);
        const flagParser = new Flag(this.TransactionType, intFlags);
        return flagParser.parse();
    }

    set Flags(flags: any) {
        const intFlags = get(this, ['tx', 'Flags'], undefined);
        const flagParser = new Flag(this.TransactionType, intFlags);

        flags.forEach((f: any) => {
            flagParser.set(f);
        });
        set(this, ['tx', 'Flags'], flagParser.get());
    }

    set Fee(fee: string) {
        set(this, ['tx', 'Fee'], new Amount(fee, false).nativeToDrops());
    }

    get Fee(): string {
        const fee = get(this, ['tx', 'Fee'], undefined);
        if (isUndefined(fee)) return undefined;
        return new Amount(fee).dropsToNative();
    }

    get Date(): any {
        const date = get(this, ['tx', 'date'], undefined);
        if (isUndefined(date)) return undefined;
        const ledgerDate = new LedgerDate(date);
        return ledgerDate.toISO8601();
    }

    get SubmitResult(): SubmitResultType {
        return get(this, 'submitResult', undefined);
    }

    set SubmitResult(result: SubmitResultType) {
        set(this, 'submitResult', result);
    }

    get VerifyResult(): VerifyResultType {
        const result = get(this, 'verifyResult', undefined);

        if (isUndefined(result)) {
            return {
                success: false,
            };
        }

        return result;
    }

    set VerifyResult(result: VerifyResultType) {
        set(this, 'verifyResult', result);
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

    get CTID(): string {
        return EncodeCTID(this.LedgerIndex, this.TransactionIndex, NetworkService.getNetworkId());
    }

    get Hash(): string {
        return get(this, ['tx', 'hash']);
    }

    set Hash(hash: string) {
        set(this, ['tx', 'hash'], hash);
    }

    get LedgerIndex(): number {
        return get(this, ['tx', 'ledger_index']);
    }

    set LedgerIndex(index: number) {
        set(this, ['tx', 'ledger_index'], index);
    }

    get TransactionIndex(): number {
        return get(this, ['meta', 'TransactionIndex']);
    }

    set TransactionIndex(index: number) {
        set(this, ['meta', 'TransactionIndex'], index);
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

    set NetworkID(networkId: number) {
        set(this, ['tx', 'NetworkID'], networkId);
    }

    get NetworkID(): number {
        return get(this, ['tx', 'NetworkID'], undefined);
    }

    get OperationLimit(): number {
        return get(this, ['tx', 'OperationLimit'], undefined);
    }

    get HookParameters(): {
        HookParameter: {
            HookParameterName: string;
            HookParameterValue: string;
        };
    }[] {
        return get(this, ['tx', 'HookParameters'], undefined);
    }
}

/* Export ==================================================================== */
export default BaseTransaction;
