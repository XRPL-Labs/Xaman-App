import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

export default interface URIToken extends BaseLedgerEntry, HasPreviousTxnID {
    Digest: string;
    Issuer: string;
    URI: number;
    Flags: number;
    Owner: string;
    OwnerNode?: string;
    // custom added by me, not really in the spec
    LedgerCloseTime?: number;
}
