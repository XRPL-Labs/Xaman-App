import { Memo, Signer } from '../common';
import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

/**
 * Every transaction has the same set of common fields.
 */
export interface TransactionJson {
    /** The unique address of the transaction sender. */
    Account: string;
    /**
     * The type of transaction. Valid types include: `Payment`, `OfferCreate`,
     * `TrustSet`, and many others.
     */
    TransactionType: TransactionTypes | PseudoTransactionTypes;
    /**
     * Integer amount of XRP, in drops, to be destroyed as a cost for
     * distributing this transaction to the network. Some transaction types have
     * different minimum requirements.
     */
    Fee?: string;
    /**
     * The sequence number of the account sending the transaction. A transaction
     * is only valid if the Sequence number is exactly 1 greater than the previous
     * transaction from the same account. The special case 0 means the transaction
     * is using a Ticket instead.
     */
    Sequence?: number;
    /**
     * Hash value identifying another transaction. If provided, this transaction
     * is only valid if the sending account's previously-sent transaction matches
     * the provided hash.
     */
    AccountTxnID?: string;
    /** Set of bit-flags for this transaction. */
    Flags?: number;
    /**
     * Highest ledger index this transaction can appear in. Specifying this field
     * places a strict upper limit on how long the transaction can wait to be
     * validated or rejected.
     */
    LastLedgerSequence?: number;
    /**
     * Additional arbitrary information used to identify this transaction.
     */
    Memos?: { Memo: Memo }[];
    /**
     * Array of objects that represent a multi-signature which authorizes this
     * transaction.
     */
    Signers?: { Signer: Signer }[];
    /**
     * Arbitrary integer used to identify the reason for this payment, or a sender
     * on whose behalf this transaction is made. Conventionally, a refund should
     * specify the initial payment's SourceTag as the refund payment's
     * DestinationTag.
     */
    SourceTag?: number;
    /**
     * Hex representation of the public key that corresponds to the private key
     * used to sign this transaction. If an empty string, indicates a
     * multi-signature is present in the Signers field instead.
     */
    SigningPubKey?: string;
    /**
     * The sequence number of the ticket to use in place of a Sequence number. If
     * this is provided, Sequence must be 0. Cannot be used with AccountTxnID.
     */
    TicketSequence?: number;
    /**
     * The signature that verifies this transaction as originating from the
     * account it says it is from.
     */
    TxnSignature?: string;
    /**
     * The network id of the transaction.
     */
    NetworkID?: number;

    /**
     * Rest of fields
     */
    [Field: string]: string | number | Array<any> | undefined | object | boolean;
}
