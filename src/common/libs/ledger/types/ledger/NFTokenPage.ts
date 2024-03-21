import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

export interface NFTokenPage extends BaseLedgerEntry, HasPreviousTxnID {
    NextPageMin?: string;
    NFTokens: {
        NFToken: {
            Flags: number;
            Issuer: string;
            NFTokenID: string;
            NFTokenTaxon: number;
            URI?: string;
        };
    }[];
    PreviousPageMin?: string;
}
