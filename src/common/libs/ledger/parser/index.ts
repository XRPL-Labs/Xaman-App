import { get, has } from 'lodash';

import { LedgerTransactionType, TransactionJSONType } from '@common/libs/ledger/types';

import * as Transactions from '@common/libs/ledger/transactions';
import { TransactionsType } from '@common/libs/ledger/transactions/types';

const parserFactory = (tx: LedgerTransactionType | TransactionJSONType): TransactionsType => {
    let passedObject = {} as LedgerTransactionType;
    let type;

    // if tx is LedgerTransactionType
    if (has(tx, 'transaction') || has(tx, 'tx')) {
        type = get(tx, ['transaction', 'TransactionType'], undefined);

        if (!type) {
            type = get(tx, ['tx', 'TransactionType'], undefined);
        }
        // @ts-ignore
        passedObject = tx;
    } else {
        // or TransactionJSONType
        type = get(tx, ['TransactionType'], undefined);
        passedObject = Object.assign(passedObject, { tx });
    }

    const Transaction = get(Transactions, type, Transactions.BaseTransaction);
    return new Transaction(passedObject);
};

export default parserFactory;
