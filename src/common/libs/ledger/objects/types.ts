import { AmountType } from '../parser/types';

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
