import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

/**
 * The Delegate object type represents a list of parties that, as a group,
 * are Delegated to sign a transaction in place of an individual account. You
 * can create, replace, or remove a signer list using a DelegateSet
 * transaction.
 *
 * @category Ledger Entries
 */
export default interface Credential extends BaseLedgerEntry, HasPreviousTxnID {
    Expiration: number;
    Flags: number;
    OwnerNode: string;
    CredentialType: string;
    Issuer: string;
    Subject: string;
    URI: string;
}
