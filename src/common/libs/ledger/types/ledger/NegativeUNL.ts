import { BaseLedgerEntry, MissingPreviousTxnID } from './BaseLedgerEntry';

/**
 * The NegativeUNL object type contains the current status of the Negative UNL,
 * a list of trusted validators currently believed to be offline.
 *
 * @category Ledger Entries
 */
export default interface NegativeUNL extends BaseLedgerEntry, MissingPreviousTxnID {
    /**
     * A list of trusted validators that are currently disabled.
     */
    DisabledValidators?: Array<{
        FirstLedgerSequence: number;
        PublicKey: string;
    }>;
    /**
     * The public key of a trusted validator that is scheduled to be disabled in
     * the next flag ledger.
     */
    ValidatorToDisable?: string;
    /**
     * The public key of a trusted validator in the Negative UNL that is
     * scheduled to be re-enabled in the next flag ledger.
     */
    ValidatorToReEnable?: string;
}
