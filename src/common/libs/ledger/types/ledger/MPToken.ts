import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

export default interface MPToken extends BaseLedgerEntry, HasPreviousTxnID {
    Account: string; // ACCOUNTID
    MPTokenIssuanceID: string; // UINT192
    MPTAmount?: number; // UINT64 (default)
    Flags?: number; // UINT32 (default)
    PreviousTxnID: string; // HASH256
    PreviousTxnLgrSeq: number; // UINT32
    OwnerNode: number; // UINT64
}

export enum MPTokenFlags {
    // Indicates that the MPT is currently locked
    lsfMPTLocked = 0x0001,
    // Indicates that the holder is authorized (for allow-listing)
    lsfMPTAuthorized = 0x0002,
}
