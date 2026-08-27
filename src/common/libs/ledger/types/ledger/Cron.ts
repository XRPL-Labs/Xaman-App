import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

/**
 * The Cron object type represents a scheduled job
 *
 * @category Ledger Entries
 */
export default interface Cron extends BaseLedgerEntry, HasPreviousTxnID {
    Account: string;
    StartTime?: number;
    RepeatCount?: number;
    DelaySeconds?: number;
}
