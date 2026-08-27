import { Currency } from '../common';

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

/**
 * A Vault ledger object - aggregates assets from depositors using MPTs for shares
 *
 * @category Ledger Entries
 */
export default interface Vault extends BaseLedgerEntry, HasPreviousTxnID {
    /** The account that created and manages the vault */
    Owner: string;
    /** Pseudo-account that holds the vault's assets */
    Account: string;
    /** The type of asset this vault holds */
    Asset: Currency;
    /** Total assets currently in the vault */
    AssetsTotal: string;
    /** Assets available for withdrawal */
    AssetsAvailable: string;
    /** MPT issuance ID for vault shares */
    ShareMPTID: string;
    /** Potential unrealized loss */
    LossUnrealized?: string;
    /** Decimal precision for share calculations (0-18) */
    Scale?: number;
    /** Maximum assets the vault can hold */
    AssetsMaximum?: string;
    /** Link to permissioned domain for private vaults */
    DomainID?: string;
    /** Arbitrary vault metadata in hex format */
    Data?: string;
    /** Withdrawal strategy indicator */
    WithdrawalPolicy?: number;
    /** Transaction sequence number establishing the vault */
    Sequence?: number;
    /** Bit-map of boolean flags */
    Flags: number;
    /** Directory page hint */
    OwnerNode?: string;
}

export enum VaultFlags {
    /** Private vault requiring credentials */
    lsfVaultPrivate = 0x00010000,
}
