import { AmountType } from '../parser/types';

export type LedgerEntriesTypes = OfferLedgerEntry | EscrowLedgerEntry | CheckLedgerEntry;

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
