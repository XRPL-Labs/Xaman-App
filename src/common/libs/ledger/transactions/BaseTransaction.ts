/**
 * Base Ledger transaction
 */

import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';

import { TransactionType, AccountID, Amount, UInt32, Hash256, STArray, Blob } from '@common/libs/ledger/parser/fields';
import { Flags, Signers, Memos, HookParameters } from '@common/libs/ledger/parser/fields/codec';
import { createPropertyConfig } from '@common/libs/ledger/parser/fields/factory';

/* Types ==================================================================== */
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class BaseTransaction {
    protected _tx: TransactionJson | Record<string, never>;
    protected _meta: TransactionMetadata | Record<string, never>;

    // abstract
    public static Fields: { [key: string]: FieldConfig } = {};

    // common fields
    public static CommonFields: { [key: string]: FieldConfig } = {
        hash: { required: true, type: Hash256 },
        TransactionType: { required: true, type: TransactionType },
        Account: { required: true, type: AccountID },
        Sequence: { required: true, type: UInt32 },
        LastLedgerSequence: { required: true, type: UInt32 },

        SourceTag: { type: UInt32 },
        Memos: { type: STArray, codec: Memos },
        Flags: { type: UInt32, codec: Flags },
        Signers: { type: STArray, codec: Signers },
        Fee: { type: Amount },
        TicketSequence: { type: UInt32 },
        NetworkID: { type: UInt32 },
        FirstLedgerSequence: { type: UInt32 },
        OperationLimit: { type: UInt32 },
        SigningPubKey: { type: Blob },
        TxnSignature: { type: Blob },
        HookParameters: { type: STArray, codec: HookParameters },
        AccountTxnID: { type: Hash256 },
        PreviousTxnID: { type: Hash256 },
    };

    declare hash: FieldReturnType<typeof Hash256>;
    declare TransactionType: FieldReturnType<typeof TransactionType>;
    declare Account: FieldReturnType<typeof AccountID>;
    declare Sequence: FieldReturnType<typeof UInt32>;
    declare LastLedgerSequence: FieldReturnType<typeof UInt32>;

    declare SourceTag?: FieldReturnType<typeof UInt32>;
    declare Signers?: FieldReturnType<typeof STArray>;
    declare Memos?: FieldReturnType<typeof STArray, typeof Memos>;
    declare Flags?: FieldReturnType<typeof UInt32, typeof Flags>;
    declare Fee?: FieldReturnType<typeof Amount>;
    declare TicketSequence?: FieldReturnType<typeof UInt32>;
    declare NetworkID?: FieldReturnType<typeof UInt32>;
    declare FirstLedgerSequence?: FieldReturnType<typeof UInt32>;
    declare OperationLimit?: FieldReturnType<typeof UInt32>;
    declare SigningPubKey?: FieldReturnType<typeof Blob>;
    declare TxnSignature?: FieldReturnType<typeof Blob>;
    declare HookParameters?: FieldReturnType<typeof STArray, typeof HookParameters>;
    declare AccountTxnID?: FieldReturnType<typeof Hash256>;
    declare PreviousTxnID?: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        this._tx = tx ?? {};
        this._meta = meta ?? {};

        const fields = {
            ...(this.constructor as typeof BaseTransaction).Fields,
            ...BaseTransaction.CommonFields,
        };

        for (const property of Object.keys(fields)) {
            // get the property config
            const fieldConfig = createPropertyConfig(property, fields[property], this._tx);
            // define the property
            Object.defineProperty(this, property, fieldConfig);
        }

        // seal the object
        // Object.seal(this);
    }

    /**
     * check if transaction is a Pseudo transaction
     * @returns boolean
     */
    isPseudoTransaction(): boolean {
        return typeof this.TransactionType === 'undefined';
    }

    /**
     * serialize transaction object to the ledger tx json
     */
    get Json(): TransactionJson {
        // shallow copy
        const tx = { ...this._tx } as TransactionJson;
        Object.getOwnPropertyNames(this._tx).forEach((k: string) => {
            if (
                !Object.keys({
                    ...BaseTransaction.CommonFields,
                    ...(this.constructor as typeof BaseTransaction).Fields,
                }).includes(k)
            ) {
                delete tx[k];
            }
        });

        return tx;
    }

    get MetaData() {
        return { ...this._meta };
    }
}

/* Export ==================================================================== */
export default BaseTransaction;
