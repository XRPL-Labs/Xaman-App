import { get, has } from 'lodash';

import { LedgerTransactionType, PseudoTransactionTypes, TransactionJSONType } from '@common/libs/ledger/types';

import * as Transactions from '@common/libs/ledger/transactions';
import * as PseudoTransactions from '@common/libs/ledger/transactions/pseudo';

import {
    Transactions as TransactionsType,
    PseudoTransactions as PseudoTransactionsType,
} from '@common/libs/ledger/transactions/types';

/* Module ==================================================================== */
const TransactionFactory = {
    getPseudoTransaction: (json: TransactionJSONType, type: PseudoTransactionTypes): PseudoTransactionsType => {
        switch (type) {
            case PseudoTransactionTypes.SignIn:
                return new PseudoTransactions.SignIn(json);
            case PseudoTransactionTypes.PaymentChannelAuthorize:
                return new PseudoTransactions.PaymentChannelAuthorize(json);
            default:
                throw new Error('Unsupported pseudo transaction type');
        }
    },

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

    /*
       Parse a LEDGER transaction to Transaction instance
     */
    fromLedger: (item: LedgerTransactionType): TransactionsType => {
        if (!has(item, 'tx') || !has(item, 'meta')) {
            throw new Error('Provided item is not a valid Ledger transaction type!');
        }
        const transaction = get(item, 'tx');
        const meta = get(item, 'meta');
        return TransactionFactory.getTransaction(transaction, meta);
    },

    /*
       Parse a JSON transaction to Transaction instance
     */
    fromJson: (item: TransactionJSONType): TransactionsType => {
        return TransactionFactory.getTransaction(item);
    },
};

/* Export ==================================================================== */
export default TransactionFactory;
