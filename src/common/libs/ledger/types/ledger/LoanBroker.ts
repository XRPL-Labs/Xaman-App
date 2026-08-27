import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

/**
 * A LoanBroker ledger object - manages uncollateralized loans using pooled funds from a Vault
 *
 * @category Ledger Entries
 */
export default interface LoanBroker extends BaseLedgerEntry, HasPreviousTxnID {
    /** The account that created and manages the loan broker */
    Owner: string;
    /** Pseudo-account that holds the broker's first-loss capital */
    Account: string;
    /** The associated Vault that provides loaned assets */
    VaultID: string;
    /** Transaction sequence number that created this broker */
    Sequence: number;
    /** Sequential identifier for loans, incremented each time a new loan is created */
    LoanSequence: number;
    /** Total asset amount the protocol owes the vault, including interest */
    DebtTotal: string;
    /** Maximum amount the protocol can owe the vault (0 = unlimited) */
    DebtMaximum: string;
    /** Total amount of first-loss capital deposited */
    CoverAvailable: string;
    /** Required coverage percentage in 1/10th basis points (0-100000) */
    CoverRateMinimum: number;
    /** Percentage of first-loss capital liquidated on default in 1/10th basis points */
    CoverRateLiquidation: number;
    /** Fee charged by the lending protocol in 1/10th basis points (0-10000) */
    ManagementFeeRate?: number;
    /** Number of active loans issued by this broker */
    OwnerCount: number;
    /** Arbitrary metadata about the broker (max 256 bytes) */
    Data?: string;
    /** Directory page hint for owner */
    OwnerNode?: string;
    /** Directory page hint for vault */
    VaultNode?: string;
    /** Bit-map of boolean flags */
    Flags: number;
}

export enum LoanBrokerFlags {
    // No flags defined currently
}
