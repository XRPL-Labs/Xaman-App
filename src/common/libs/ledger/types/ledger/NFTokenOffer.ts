import { Amount } from '../common';

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

export interface NFTokenOffer extends BaseLedgerEntry, HasPreviousTxnID {
    Amount: Amount;
    Destination?: string;
    Expiration: number;
    Flags: number;
    NFTokenOfferNode?: string;
    Owner: string;
    OwnerNode?: string;
}
