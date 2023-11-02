/**
 * Meta data types
 */
export enum OfferStatus {
    CREATED = 'CREATED',
    PARTIALLY_FILLED = 'PARTIALLY_FILLED',
    FILLED = 'FILLED',
    CANCELLED = 'CANCELLED',
    KILLED = 'KILLED',
    UNKNOWN = 'UNKNOWN',
}

export interface BalanceChangeType extends AmountType {
    action: 'DEC' | 'INC';
}

/**
 * Ledger and transaction types
 */
export interface AmountType extends Issuer {
    value: string;
}

export type LedgerAmount = string | AmountType;

/**
 * Specification of which currency the account taking the offer would pay/
 * receive, as an object with currency and issuer fields (omit issuer for native asset).
 * Similar to currency amounts.
 */
export interface TakerRequestAmount {
    currency: string;
    issuer?: string;
}

/**
 * A currency-counterparty pair, or just currency if it's native currency.
 */
export interface Issuer {
    currency: string;
    issuer?: string;
    counterparty?: string;
}

/**
 * Trustline Transaction schema from rippled
 */
export interface Trustline {
    account: string;
    balance: string;
    currency: string;
    limit: string;
    limit_peer: string;
    quality_in: number;
    quality_out: number;
    no_ripple?: boolean;
    no_ripple_peer?: boolean;
    freeze?: boolean;
    freeze_peer?: boolean;
    authorized?: boolean;
    peer_authorized?: boolean;
}

/**
 * Transaction Memo format
 */
export type MemoType = {
    MemoData?: string;
    MemoFormat?: string;
    MemoType?: string;
};

/**
 * Transaction Account
 */
export type Account = {
    name?: string;
    address: string;
    tag?: number;
};

/**
 * Transaction Destination
 */
export type Destination = {
    name?: string;
    address: string;
    tag?: number;
};

/**
 * Transaction Result submitted by the app
 */
export type TransactionResult = {
    success: boolean;
    code: string;
    message?: string;
};

/**
 * Signer entry
 */
export type SignerEntry = {
    account: string;
    weight: number;
    walletLocator?: string;
};

export interface Signer {
    account: string;
    signature: string;
    pubKey: string;
}
