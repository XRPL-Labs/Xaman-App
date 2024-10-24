import { PriceData } from '@common/libs/ledger/types/common';

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry';

/*
 * An Oracle ledger entry holds data associated with a single price oracle object.
 */
export default interface Oracle extends BaseLedgerEntry, HasPreviousTxnID {
    /**
     * The XRPL account with update and delete privileges for the oracle.
     * It's recommended to set up multi-signing on this account.
     */
    Owner: string;

    /**
     * An arbitrary value that identifies an oracle provider, such as Chainlink, Band, or DIA.
     * This field is a string, up to 256 ASCII hex encoded characters (0x20-0x7E).
     */
    Provider: string;

    /**
     * An array of up to 10 PriceData objects, each representing the price information for a token pair.
     * More than five PriceData objects require two owner reserves.
     */
    PriceDataSeries: Array<PriceData>;

    /**
     * The time the data was last updated, represented in Unix time.
     */
    LastUpdateTime: number;

    /**
     * An optional Universal Resource Identifier to reference price data off-chain.
     * This field is limited to 256 bytes.
     */
    URI?: string;

    /**
     * Describes the type of asset, such as "currency", "commodity", or "index".
     * This field is a string, up to 16 ASCII hex encoded characters (0x20-0x7E).
     */
    AssetClass: string;

    /**
     * A hint indicating which page of the oracle owner's owner directory links to this entry,
     * in case the directory consists of multiple pages.
     */
    OwnerNode: string;
}
