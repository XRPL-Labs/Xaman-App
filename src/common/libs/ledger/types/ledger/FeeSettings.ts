import { BaseLedgerEntry, MissingPreviousTxnID } from './BaseLedgerEntry';

export interface FeeSettingsPreAmendmentFields {
    /** The transaction cost of the "reference transaction" in drops of XRP as hexadecimal. */
    BaseFee: string;
    /** The BaseFee translated into "fee units". */
    ReferenceFeeUnits: number;
    /** The base reserve for an account in the XRP Ledger, as drops of XRP. */
    ReserveBase: number;
    /** The incremental owner reserve for owning objects, as drops of XRP. */
    ReserveIncrement: number;
}

export interface FeeSettingsPostAmendmentFields {
    /** The transaction cost of the "reference transaction" in drops of XRP as hexadecimal. */
    BaseFeeDrops: string;
    /** The base reserve for an account in the XRP Ledger, as drops of XRP. */
    ReserveBaseDrops: string;
    /** The incremental owner reserve for owning objects, as drops of XRP. */
    ReserveIncrementDrops: string;
}

export interface FeeSettingsBase extends BaseLedgerEntry, MissingPreviousTxnID {
    /**
     * A bit-map of boolean flags for this object. No flags are defined for this type.
     */
    Flags: 0;
}

/**
 * The FeeSettings object type contains the current base transaction cost and
 * reserve amounts as determined by fee voting.
 *
 * The fields will be based on the status of the `XRPFees` amendment.
 * - Before: {@link FeeSettingsPreAmendmentFields}
 * - After: {@link FeeSettingsPostAmendmentFields}
 *
 * @interface
 *
 * @category Ledger Entries
 */
type FeeSettings = FeeSettingsBase & (FeeSettingsPreAmendmentFields | FeeSettingsPostAmendmentFields);

export default FeeSettings;
