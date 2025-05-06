declare module 'ripple-lib-transactionparser' {
    /**
     * Balance change object representing a single balance change
     */
    export interface BalanceChange {
        /**
         * The opposite party on the trustline, or empty string for XRP
         */
        counterparty: string;

        /**
         * 'XRP' for XRP, a 3-letter ISO currency code, or a 160-bit hex string in the Currency format
         */
        currency: string;

        /**
         * The change in balance as a decimal string
         */
        value: string;
    }

    /**
     * Result of parseBalanceChanges - a mapping of Ripple addresses to their balance changes
     */
    export type BalanceChangesResult = {
        [rippleAddress: string]: BalanceChange[];
    };

    /**
     * Takes a transaction metadata object (as returned by a ripple-lib response)
     * and computes the balance changes that were caused by that transaction.
     *
     * @param metadata - The transaction metadata object from a ripple-lib response
     * @returns An object mapping Ripple addresses to arrays of balance changes
     */
    export function parseBalanceChanges(metadata: any): BalanceChangesResult;
}
