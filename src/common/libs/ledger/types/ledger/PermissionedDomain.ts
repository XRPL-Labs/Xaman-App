import { AcceptedCredentialEntry } from '../common';

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

/**
 * A Permissioned Domain object
 *
 * @category Ledger Entries
 */
export default interface PermissionedDomain extends BaseLedgerEntry, HasPreviousTxnID {
    /** The account that owns the permission. */
    Owner: string;
    /**
     * A bit-map of boolean flags. No flags are defined for DepositPreauth
     * objects, so this value is always 0.
     */
    Flags: 0;
    /**
     * A hint indicating which page of the sender's owner directory links to this
     * object, in case the directory consists of multiple pages.
     */
    OwnerNode: string;
    /**
     * The credentials
     */
    AcceptedCredentials: AcceptedCredentialEntry[];
}
