import { get, has } from 'lodash';

import * as Transactions from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactions from '@common/libs/ledger/transactions/pseudo';

/* Types ==================================================================== */
import { LedgerTransactionType, PseudoTransactionTypes, TransactionJSONType } from '@common/libs/ledger/types';

import {
    Transactions as TransactionsType,
    PseudoTransactions as PseudoTransactionsType,
} from '@common/libs/ledger/transactions/types';

/* Module ==================================================================== */
const TransactionFactory = {
    /**
     * Returns a pseudo transaction based on the given type.
     *
     * @function
     * @param {TransactionJSONType} json - The JSON representation of the transaction.
     * @param {PseudoTransactionTypes} type - The type of pseudo transaction to generate.
     * @returns {PseudoTransactionsType} Returns an instance of the appropriate pseudo transaction.
     * @throws {Error} Throws an error if the pseudo transaction type is unsupported.
     */
    getPseudoTransaction: (json: TransactionJSONType, type: PseudoTransactionTypes): PseudoTransactionsType => {
        switch (type) {
            case PseudoTransactionTypes.SignIn:
                return new PseudoTransactions.SignIn(json);
            case PseudoTransactionTypes.PaymentChannelAuthorize:
                return new PseudoTransactions.PaymentChannelAuthorize(json);
            default:
                throw new Error(`Unsupported Pseudo transaction type ${type}`);
        }
    },

    /**
     * Returns a transaction based on the given transaction JSON.
     *
     * @function
     * @param {TransactionJSONType} transaction - The JSON representation of the transaction.
     * @param {any} [meta] - Optional metadata associated with the transaction.
     * @returns {TransactionsType} Returns an instance of the appropriate transaction.
     * @throws {Error} Throws an error if the transaction type is unsupported.
     */
    getTransaction: (transaction: TransactionJSONType, meta?: any): TransactionsType => {
        // get the transaction type
        const type = get(transaction, 'TransactionType', undefined);
        // get transaction class
        const Transaction = get(Transactions, type, undefined);

        if (typeof Transaction === 'undefined') {
            throw new Error(`Unsupported transaction type ${type}`);
        }

        return new Transaction(transaction, meta);
    },

    /**
     * Parses a LEDGER transaction and returns a Transaction instance.
     *
     * @function
     * @param {LedgerTransactionType} item - The ledger transaction to parse.
     * @returns {TransactionsType} Returns an instance of the corresponding transaction.
     * @throws {Error} Throws an error if the provided item is not a valid Ledger transaction type.
     */
    fromLedger: (item: LedgerTransactionType): TransactionsType => {
        if (!has(item, 'tx') || !has(item, 'meta')) {
            throw new Error('Provided item is not a valid Ledger transaction type!');
        }
        const transaction = get(item, 'tx');
        const meta = get(item, 'meta');
        return TransactionFactory.getTransaction(transaction, meta);
    },

    /**
     * Parses a JSON transaction and returns a Transaction instance.
     *
     * @function
     * @param {TransactionJSONType} item - The JSON representation of the transaction to parse.
     * @returns {TransactionsType} Returns an instance of the corresponding transaction.
     */
    fromJson: (item: TransactionJSONType): TransactionsType => {
        return TransactionFactory.getTransaction(item);
    },
};

/* Export ==================================================================== */
export default TransactionFactory;
