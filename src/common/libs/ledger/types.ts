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

export interface Balance {
    currency: string;
    value: string;
}

export interface AccountRoot {
    Account: string;
    Balance: string;
    Flags: number;
    OwnerCount: number;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
    Sequence: number;
    AccountTxnID?: string;
    Domain?: string;
    EmailHash?: string;
    MessageKey?: string;
    RegularKey?: string;
    TicketCount?: number;
    TickSize?: number;
    TransferRate?: number;
}

/**
 * Ledger Account tx ledger response
 */
export type AccountTxResponse = {
    account: string;
    ledger_index_max: number;
    ledger_index_min: number;
    limit: number;
    marker: LedgerMarker;
    transactions: Array<LedgerTransactionType>;
};

/**
 * Ledger trustline type
 */
export interface LedgerTrustline {
    account: string;
    balance: string;
    currency: string;
    limit: string;
    limit_peer: string;
    quality_in: number;
    quality_out: number;
    no_ripple?: boolean;
    no_ripple_peer?: boolean;
    authorized?: boolean;
    peer_authorized?: boolean;
    freeze?: boolean;
    freeze_peer?: boolean;
    obligation?: boolean;
}

/**
 * Ledger account_lines response
 */
export type AccountLinesResponse = {
    account: string;
    lines: LedgerTrustline[];
    ledger_current_index?: number;
    ledger_index?: number;
    ledger_hash?: string;
    marker?: string;
};

/**
 * Ledger gateway_balances response
 */
export interface GatewayBalancesResponse {
    account: string;
    obligations?: { [currency: string]: string };
    balances?: { [address: string]: Balance[] };
    assets?: { [address: string]: Balance[] };
    ledger_hash?: string;
    ledger_current_index?: number;
    ledger_index?: number;
}

/**
 * Ledger account_info response
 */
export interface AccountInfoResponse {
    account_data: AccountRoot;
    signer_lists?: any;
    ledger_current_index?: number;
    ledger_index?: number;
    validated?: boolean;
}
