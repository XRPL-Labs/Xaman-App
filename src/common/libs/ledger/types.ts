import { Memo } from './parser/types';

/**
 * TX Json Transaction Type
 */
export type TransactionJSONType = {
    Account?: string;
    TransactionType?: string;
    Memos?: { Memo: Memo }[];
    Flags?: number;
    Fulfillment?: string;
    LastLedgerSequence?: number;
    [Field: string]: string | number | Array<any> | undefined | object;
};

/**
 * Ledger Transaction schema from rippled
 */
export interface LedgerTransactionType {
    engine_result?: string;
    engine_result_code?: number;
    engine_result_message?: string;
    ledger_hash?: string;
    ledger_index?: number;
    status?: string;
    transaction?: TransactionJSONType;
    tx?: TransactionJSONType;
    meta?: any;
    [key: string]: any;
}

/**
 * Transaction Signed Type
 */
export type SignedObjectType = {
    type?: 'SignedTx' | 'MultiSignedTx';
    id?: string;
    signedTransaction: string;
    txJson?: Object;
    signers?: string[];
    signMethod?: 'PIN' | 'BIOMETRIC' | 'PASSPHRASE' | 'TANGEM' | 'OTHER';
};

/**
 * Submit Result Type
 */
export type SubmitResultType = {
    success: boolean;
    engineResult?: string;
    message: string;
    transactionId?: string;
    node?: string;
    nodeType?: string;
};

/**
 * Verify Result Type
 */
export type VerifyResultType = {
    success: boolean;
    transaction?: any;
};

export type LedgerMarker = {
    ledger: number;
    seq: number;
};
/**
 * Account TX response
 */
export type AccountTxResponse = {
    account: string;
    ledger_index_max: number;
    ledger_index_min: number;
    limit: number;
    marker: LedgerMarker;
    transactions: Array<LedgerTransactionType>;
};
