import { AmountType, LedgerAmount } from './parser/types';

export enum TransactionBaseTypes {
    Transaction = 'Transaction',
}
export enum TransactionTypes {
    Payment = 'Payment',
    TrustSet = 'TrustSet',
    AccountDelete = 'AccountDelete',
    AccountSet = 'AccountSet',
    OfferCreate = 'OfferCreate',
    OfferCancel = 'OfferCancel',
    EscrowCreate = 'EscrowCreate',
    EscrowCancel = 'EscrowCancel',
    EscrowFinish = 'EscrowFinish',
    SetRegularKey = 'SetRegularKey',
    SignerListSet = 'SignerListSet',
    DepositPreauth = 'DepositPreauth',
    CheckCreate = 'CheckCreate',
    CheckCash = 'CheckCash',
    CheckCancel = 'CheckCancel',
    TicketCreate = 'TicketCreate',
    PaymentChannelCreate = 'PaymentChannelCreate',
    PaymentChannelClaim = 'PaymentChannelClaim',
    PaymentChannelFund = 'PaymentChannelFund',
    NFTokenMint = 'NFTokenMint',
    NFTokenBurn = 'NFTokenBurn',
    NFTokenCreateOffer = 'NFTokenCreateOffer',
    NFTokenAcceptOffer = 'NFTokenAcceptOffer',
    NFTokenCancelOffer = 'NFTokenCancelOffer',
}

export enum PseudoTransactionTypes {
    SignIn = 'SignIn',
    PaymentChannelAuthorize = 'PaymentChannelAuthorize',
}

export enum LedgerObjectTypes {
    Check = 'Check',
    Escrow = 'Escrow',
    NFTokenOffer = 'NFTokenOffer',
    Offer = 'Offer',
    Ticket = 'Ticket',

    PayChannel = 'PayChannel',
}

/**
 * TX Json Transaction Type
 */
export type TransactionJSONType = {
    Account?: string;
    TransactionType?: string;
    Memos?: { Memo: { MemoType?: string; MemoData?: string; MemoFormat?: string } }[];
    Flags?: number;
    Fulfillment?: string;
    LastLedgerSequence?: number;
    [Field: string]: string | number | Array<any> | undefined | object | boolean;
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
    tx?: TransactionJSONType;
    meta?: any;
    [key: string]: any;
}

/**
 * Transaction Signed Type
 */
export type SignedObjectType = {
    type?: 'SignedTx' | 'MultiSignedTx' | 'SignedPayChanAuth';
    id?: string;
    signedTransaction: string;
    txJson?: Object;
    signers?: string[];
    signerPubKey?: string;
    signMethod?: 'PIN' | 'BIOMETRIC' | 'PASSPHRASE' | 'TANGEM' | 'OTHER';
};

/**
 * Submit Result Type
 */
export type SubmitResultType = {
    success: boolean;
    engineResult: string;
    message: string;
    hash?: string;
    node: string;
    nodeType: string;
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
 * Ledger nft type
 */
export interface LedgerNFToken {
    Flags: number;
    Issuer: string;
    NFTokenID: string;
    NFTokenTaxon: number;
    TransferFee: number;
    URI: string;
    nft_serial: number;
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

export interface AccountNFTsResponse {
    account: string;
    account_nfts: LedgerNFToken[];
    ledger_hash?: string;
    ledger_index?: number;
    marker?: string;
}

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
    error?: string;
}

/**
 * Ledger account_objects response
 */
export interface AccountObjectsResponse {
    account: string;
    account_objects: LedgerEntriesTypes[];
    ledger_hash?: string;
    ledger_index?: number;
    ledger_current_index?: number;
    limit?: number;
    marker?: string;
    validated?: boolean;
    error?: string;
}

/**
 * Ledger fee command response
 */
interface FeeResponseDrops {
    minimum_fee: string;
    median_fee: string;
    open_ledger_fee: string;
}
export interface FeeResponse {
    current_queue_size: string;
    max_queue_size: string;
    drops: FeeResponseDrops;
}

/**
 * Ledger ledger_entry command response
 */
export interface LedgerEntryResponse {
    index: string;
    ledger_current_index: number;
    node?: LedgerEntriesTypes;
    validated?: boolean;
}

export type LedgerEntriesTypes =
    | OfferLedgerEntry
    | EscrowLedgerEntry
    | CheckLedgerEntry
    | RippleStateLedgerEntry
    | NFTokenOfferLedgerEntry;

/**
 * Ledger objects Entries
 */
export interface OfferLedgerEntry {
    LedgerEntryType: 'Offer';
    Flags: number;
    Account: string;
    Sequence: number;
    TakerPays: AmountType;
    TakerGets: AmountType;
    BookDirectory: string;
    BookNode: string;
    OwnerNode: string;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
    Expiration?: number;
}

export interface EscrowLedgerEntry {
    LedgerEntryType: 'Escrow';
    Account: string;
    Destination: string;
    Amount: string;
    Condition?: string;
    CancelAfter?: number;
    FinishAfter?: number;
    Flags: number;
    SourceTag?: number;
    DestinationTag?: number;
    OwnerNode: string;
    DestinationNode?: string;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
}

export interface CheckLedgerEntry {
    LedgerEntryType: 'Check';
    Account: string;
    Destination: string;
    Flags: 0;
    OwnerNode: string;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
    SendMax: string | object;
    Sequence: number;
    DestinationNode: string;
    DestinationTag: number;
    Expiration: number;
    InvoiceID: string;
    SourceTag: number;
}

export interface RippleStateLedgerEntry {
    LedgerEntryType: 'RippleState';
    Flags: number;
    Balance: AmountType;
    LowLimit: AmountType;
    HighLimit: AmountType;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
    LowNode?: string;
    HighNode?: string;
    LowQualityIn?: number;
    LowQualityOut?: number;
    HighQualityIn?: number;
    HighQualityOut?: number;
}

export interface NFTokenOfferLedgerEntry {
    LedgerEntryType: 'NFTokenOffer';
    Owner: string;
    Destination: string;
    Amount: AmountType;
    NFTokenID: string;
    Expiration?: number;
    Flags: number;
    OwnerNode: string;
    NFTokenOfferNode: string;
    PreviousTxnID: string;
    PreviousTxnLgrSeq: number;
}

interface PathStep {
    account?: string;
    currency?: string;
    issuer?: string;
    type?: number;
}

export type Path = PathStep[];

export interface PathOption {
    paths_computed: Path[];
    source_amount: LedgerAmount;
}

export interface RipplePathFindResponse {
    id?: any;
    error?: string;
    result: {
        id?: number | string;
        alternatives: PathOption[];
        destination_account: string;
        destination_currencies: string[];
        destination_amount: LedgerAmount;
        full_reply?: boolean;
        ledger_current_index?: number;
        source_account: string;
        validated: boolean;
    };
}
