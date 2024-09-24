export enum OperationActions {
    DEC,
    INC,
}

export enum OfferStatus {
    CREATED = 'CREATED',
    PARTIALLY_FILLED = 'PARTIALLY_FILLED',
    FILLED = 'FILLED',
    CANCELLED = 'CANCELLED',
    KILLED = 'KILLED',
    UNKNOWN = 'UNKNOWN',
}

export enum ClaimRewardStatus {
    OptIn = 'OptIn',
    OptOut = 'OptOut',
}

export interface AmountType {
    value: string;
    currency: string;
    issuer?: string;
}

export interface IssueType {
    currency: string;
    issuer: string;
}

export interface BalanceChangeType extends AmountType {
    action: OperationActions;
}

export interface OwnerCountChangeType {
    address: string;
    value: number;
    action: OperationActions;
}

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

/**
 * AuthAccount
 */
export type AuthAccount = {
    account: string;
};

export type MintURIToken = {
    Digest: string;
    Flags: number;
    URI: string;
};

export interface Signer {
    account: string;
    signature: string;
    pubKey: string;
}
