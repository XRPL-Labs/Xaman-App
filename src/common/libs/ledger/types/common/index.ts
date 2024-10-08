export type LedgerIndex = number | ('validated' | 'closed' | 'current');

export interface NativeCurrency {
    currency: string;
    issuer: never;
}

export interface IssuedCurrency {
    currency: string;
    issuer: string;
}

export type Currency = IssuedCurrency | NativeCurrency;

export interface IssuedCurrencyAmount extends IssuedCurrency {
    value: string;
}

export type LedgerAmount = IssuedCurrencyAmount | string;

export interface Balance {
    currency: string;
    issuer?: string;
    value: string;
}

export interface Signer {
    Account: string;
    TxnSignature: string;
    SigningPubKey: string;
}

export interface Memo {
    MemoData?: string;
    MemoType?: string;
    MemoFormat?: string;
}

export type StreamType =
    | 'consensus'
    | 'ledger'
    | 'manifests'
    | 'peer_status'
    | 'transactions'
    | 'transactions_proposed'
    | 'server'
    | 'validations';

export interface PathStep {
    account?: string;
    currency?: string;
    issuer?: string;
    type?: number;
}

export type Path = PathStep[];

export type LedgerMarker = {
    ledger: number;
    seq: number;
};

/**
 * The object that describes the signer in SignerEntries.
 */
export interface SignerEntry {
    /**
     * An XRP Ledger address whose signature contributes to the multi-signature.
     * It does not need to be a funded address in the ledger.
     */
    Account: string;
    /**
     * The weight of a signature from this signer.
     * A multi-signature is only valid if the sum weight of the signatures provided meets
     * or exceeds the signer list's SignerQuorum value.
     */
    SignerWeight: number;
    /**
     * An arbitrary 256-bit (32-byte) field that can be used to identify the signer, which
     * may be useful for smart contracts, or for identifying who controls a key in a large
     * organization.
     */
    WalletLocator?: string;
}

/**
 * This information is added to Transactions in request responses, but is not part
 * of the canonical Transaction information on ledger. These fields are denoted with
 * lowercase letters to indicate this in the rippled responses.
 */
export interface ResponseOnlyTxInfo {
    /**
     * The date/time when this transaction was included in a validated ledger.
     */
    date?: number;
    /**
     * An identifying hash value unique to this transaction, as a hex string.
     */
    hash?: string;
    /**
     * The sequence number of the ledger that included this transaction.
     */
    ledger_index?: number;
    /**
     * @deprecated Alias for ledger_index.
     */
    inLedger?: number;
}

/**
 * One offer that might be returned from either an {@link NFTBuyOffersRequest}
 * or an {@link NFTSellOffersRequest}.
 *
 * @category Responses
 */
export interface NFTOffer {
    amount: LedgerAmount;
    flags: number;
    nft_offer_index: string;
    owner: string;
    destination?: string;
    expiration?: number;
}

/**
 * One NFToken that might be returned from an {@link NFTInfoResponse}
 *
 * @category Responses
 */
export interface NFToken {
    nft_id: string;
    ledger_index: number;
    owner: string;
    is_burned: boolean;
    flags: number;
    transfer_fee: number;
    issuer: string;
    nft_taxon: number;
    nft_serial: number;
    uri: string;
}

export interface AuthAccount {
    Account: string;
}

/**
 * Hook executions
 */
export interface HookExecution {
    HookAccount: string;
    HookEmitCount: number;
    HookExecutionIndex: number;
    HookHash: string;
    HookInstructionCount: string;
    HookResult: number;
    HookReturnCode: number;
    HookReturnString: string;
    HookStateChangeCount: number;
}

export interface HookEmission {
    EmittedTxnID: string;
    HookAccount: string;
    HookHash: string;
}

/**
 * Hook Parameter
 */
export interface HookParameter {
    HookParameterName: string;
    HookParameterValue: string;
}
