/**
 * Base Pseudo Ledger transaction parser
 */

import { flatMap, get, has, isUndefined, set } from 'lodash';

import { AccountModel } from '@store/models';

import { AppScreens } from '@common/constants';
import { Navigator } from '@common/helpers/navigator';

import { PseudoTransactionTypes, SignedObjectType, TransactionJSONType } from '@common/libs/ledger/types';

import Memo from '@common/libs/ledger/parser/common/memo';
/* Types ==================================================================== */
import { Account, MemoType } from '@common/libs/ledger/parser/types';

/* Class ==================================================================== */
class BasePseudoTransaction {
    protected tx: TransactionJSONType;
    protected fields: string[];

    private isAborted: boolean;

    public SignedBlob: string;
    public SignerPubKey: string;
    public SignMethod: 'PIN' | 'BIOMETRIC' | 'PASSPHRASE' | 'TANGEM' | 'OTHER';
    public SignerAccount: any;

    constructor(tx?: TransactionJSONType) {
        if (!isUndefined(tx)) {
            this.tx = tx;
        }

        this.fields = [
            'Account',
            'Memos',
            'Sequence',
            'TicketSequence',
            'AccountTxnID',
            'LastLedgerSequence',
            'Signers',
            'SourceTag',
            'SigningPubKey',
            'TxnSignature',
        ];
    }

    /**
     Sign the transaction with provided account
     * @param {AccountModel} account object sign with
     * @param {boolean} multiSign indicates if transaction should sign for multi signing
     * @returns {Promise<string>} signed tx blob
     */
    sign = (account: AccountModel, multiSign: boolean = false): Promise<string> => {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                if (!account) {
                    reject(new Error('Account param is required!'));
                    return;
                }

                if (this.SignedBlob) {
                    reject(new Error('Pseudo Transaction already signed!'));
                    return;
                }

                // if account not set , set the signing account
                if (isUndefined(this.Account)) {
                    this.Account = {
                        address: account.address,
                    };
                }

                // if transaction aborted then don't continue
                if (this.isAborted) {
                    reject(new Error('Pseudo Transaction aborted!'));
                    return;
                }

                Navigator.showOverlay(AppScreens.Overlay.Vault, {
                    account,
                    multiSign,
                    transaction: this,
                    onSign: (signedObject: SignedObjectType) => {
                        const { signedTransaction, signers } = signedObject;

                        if (!signedTransaction) {
                            reject(new Error('Unable sign the pseudo transaction, please try again!'));
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
                    onDismissed: () => {
                        reject();
                    },
                });
            } catch (e) {
                reject(e);
            }
        });
    };

    submit = () => {
        throw new Error('Pseudo transaction cannot be submitted to the ledger!');
    };

    verify = () => {
        throw new Error('Pseudo transaction can never be submitted to the ledger!');
    };

    /*
    Abort the transaction if on progress
    this will just set a flag
    */
    abort = () => {
        this.isAborted = true;
    };

    /**
     * check if transaction is a Pseudo transaction
     * @returns boolean
     */
    isPseudoTransaction = (): boolean => true;

    get TransactionType(): PseudoTransactionTypes {
        return get(this, ['tx', 'TransactionType'], undefined);
    }

    set TransactionType(type: PseudoTransactionTypes) {
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

    get Hash(): string {
        return get(this, ['tx', 'hash']);
    }

    set Hash(hash: string) {
        set(this, ['tx', 'hash'], hash);
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
export default BasePseudoTransaction;
