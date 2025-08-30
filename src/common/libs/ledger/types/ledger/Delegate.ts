import { Permission } from '../common';

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

/**
 * The Delegate object type represents a list of parties that, as a group,
 * are Delegated to sign a transaction in place of an individual account. You
 * can create, replace, or remove a signer list using a DelegateSet
 * transaction.
 *
 * @category Ledger Entries
 */
export default interface Delegate extends BaseLedgerEntry, HasPreviousTxnID {
    /**
     * Account that is authorized
     */
    Authorize: string;
    /**
     * A bit-map of Boolean flags enabled for this signer list. For more
     * information, see Authorize Flags.
     */
    Flags: number;
    /**
     * A hint indicating which page of the owner directory links to this object,
     * in case the directory consists of multiple pages.
     */
    OwnerNode: string;
    /**
     * An array of Signer Entry objects representing the parties who are part of
     * this signer list.
     */
    Permissions: { Permissions: Permission }[];
}
