/**
Advisory helper
 */

import BigNumber from 'bignumber.js';

import LedgerService from '@services/LedgerService';

import { AccountRoot } from '@common/libs/ledger/types/ledger';
import { AccountInfoAccountFlags } from '@common/libs/ledger/types/methods/accountInfo';

/* Helper Functions ==================================================================== */
/**
 * The Advisory object provides methods to fetch account advisory information, account details,
 * and perform various checks on accounts based on their data and flags.
 */
const Advisory = {
    /* Constants ==================================================================== */
    BLACK_HOLE_KEYS: ['rrrrrrrrrrrrrrrrrrrrrhoLvTp', 'rrrrrrrrrrrrrrrrrrrrBZbvji'],
    EXCHANGE_BALANCE_THRESHOLD: 1000000000000,
    MIN_TRANSACTION_TAG: 9999,
    HIGH_SENDER_COUNT: 10,
    HIGH_PERCENTAGE_TAGGED_TX: 50,

    /**
     * Determines whether a possible exchange can take place based on the account balance.
     *
     * The function evaluates if the account balance is defined and greater than a specified threshold.
     *
     * @param {AccountRoot} accountData - The account data containing balance information.
     * @returns {boolean} - Returns true if the account balance exceeds the exchange threshold; otherwise, false.
     */
    checkPossibleExchange: (accountData?: AccountRoot): boolean => {
        return (
            !!accountData?.Balance &&
            new BigNumber(accountData.Balance).isGreaterThan(Advisory.EXCHANGE_BALANCE_THRESHOLD)
        );
    },

    /**
     * Checks if a given account is a "black hole" account.
     *
     * A black hole account is determined by checking if:
     * 1. The account has a RegularKey set.
     * 2. The master key is disabled.
     * 3. The RegularKey is one of the predefined black hole keys.
     *
     * @param {AccountRoot} accountData - The account data object containing details of the account.
     * @param {AccountInfoAccountFlags} accountFlags - The flags indicating account settings.
     * @returns {boolean} - True if the account is a black hole account, otherwise false.
     */
    checkBlackHoleAccount: (accountData?: AccountRoot, accountFlags?: AccountInfoAccountFlags): boolean => {
        return (
            !!accountData?.RegularKey &&
            !!accountFlags?.disableMasterKey &&
            Advisory.BLACK_HOLE_KEYS.includes(accountData.RegularKey)
        );
    },

    /**
     * Determines if incoming XRP is disallowed for an account based on its flags.
     *
     * @param {AccountInfoAccountFlags} accountFlags - The flags associated with the account.
     * @returns {boolean} - Returns `true` if the account disallows incoming XRP, otherwise `false`.
     */
    checkDisallowIncomingXRP: (accountFlags?: AccountInfoAccountFlags): boolean => {
        return accountFlags?.disallowIncomingXRP ?? false;
    },

    /**
     * Checks if a destination tag is required for transactions to a specific account.
     *
     * This function evaluates multiple conditions to determine if a destination tag
     * should be enforced for incoming transactions to the specified account address.
     * It first checks if the destination tag requirement is already specified in the
     * provided advisory or account flags. If not, it retrieves recent transactions
     * for the account and analyzes the percentage of incoming transactions that
     * already use a destination tag, as well as the number of unique senders.
     *
     * @param {string} address - The account address to check for destination tag requirement.
     * @param {XamanBackend.AccountAdvisoryResponse} advisory - Advisory response with force destination tag info.
     * @param {AccountInfoAccountFlags} accountFlags - Account flags indicating if destination tag is required.
     * @returns {Promise<boolean>} - Returns true if a destination tag is required, false otherwise.
     */
    checkRequireDestinationTag: async (
        address: string,
        advisory: XamanBackend.AccountAdvisoryResponse,
        accountFlags?: AccountInfoAccountFlags,
    ): Promise<boolean> => {
        // already indicates on advisory or account info ?
        if (advisory.force_dtag || accountFlags?.requireDestinationTag) {
            return true;
        }

        const transactionsResp = await LedgerService.getTransactions(address, undefined, 200);

        if (!('error' in transactionsResp) && transactionsResp.transactions?.length > 0) {
            const incomingTXS = transactionsResp.transactions.filter(
                (tx) =>
                    tx.tx.Destination === address &&
                    typeof tx.tx.Amount === 'string' && // ensure only native asset
                    new BigNumber(tx.tx.Amount).isGreaterThan(1000), // only more than 1000 drop
            );

            const incomingTxCountWithTag = incomingTXS.filter(
                (tx) => Number(tx.tx.DestinationTag) > Advisory.MIN_TRANSACTION_TAG,
            ).length;
            const uniqueSenders = new Set(incomingTXS.map((tx) => tx.tx.Account || '')).size;
            const percentageTag = (incomingTxCountWithTag / incomingTXS.length) * 100;

            return uniqueSenders >= Advisory.HIGH_SENDER_COUNT && percentageTag > Advisory.HIGH_PERCENTAGE_TAGGED_TX;
        }

        return false;
    },
};

export default Advisory;
