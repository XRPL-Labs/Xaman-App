import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

export default interface MPTokenIssuance extends BaseLedgerEntry, HasPreviousTxnID {
    Flags: number; // UINT32
    Issuer: string; // ACCOUNTID
    AssetScale?: number; // UINT8 (default)
    MaximumAmount?: number; // UINT64 (default)
    OutstandingAmount?: number; // UINT64 (default)
    TransferFee?: number; // UINT16 (default)
    MPTokenMetadata?: string; // BLOB
    mpt_issuance_id: string; // STRTING
    PreviousTxnID: string; // HASH256
    PreviousTxnLgrSeq: number; // UINT32
    OwnerNode?: number; // UINT64 (default)
    Sequence: number; // UINT32
}

export enum MPTokenIssuanceFlags {
    // Indicates that all balances are locked
    lsfMPTLocked = 0x0001,
    // Indicates that the issuer can lock individual/all balances
    lsfMPTCanLock = 0x0002,
    // Indicates that individual holders must be authorized
    lsfMPTRequireAuth = 0x0004,
    // Indicates that holders can place balances into escrow
    lsfMPTCanEscrow = 0x0008,
    // Indicates that holders can trade using DEX or AMM
    lsfMPTCanTrade = 0x0010,
    // Indicates that tokens can be transferred between non-issuers
    lsfMPTCanTransfer = 0x0020,
    // Indicates that issuer can clawback from holders
    lsfMPTCanClawback = 0x0040,
}
