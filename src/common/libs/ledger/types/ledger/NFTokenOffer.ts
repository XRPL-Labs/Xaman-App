import { LedgerAmount } from '../common';

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

export default interface NFTokenOffer extends BaseLedgerEntry, HasPreviousTxnID {
    Amount: LedgerAmount;
    Destination?: string;
    Expiration: number;
    Flags: number;
    NFTokenOfferNode?: string;
    Owner: string;
    OwnerNode?: string;
}
