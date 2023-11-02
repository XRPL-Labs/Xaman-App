import { get } from 'lodash';

import { AccountModel } from '@store/models';

import * as Transactions from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactions from '@common/libs/ledger/transactions/pseudo';

/* Types ==================================================================== */
import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types';

import {
    Transactions as TransactionsType,
    PseudoTransactions as PseudoTransactionsType,
} from '@common/libs/ledger/transactions/types';

type ValidationType<T> = (tx: T, account: AccountModel) => Promise<void>;

/* Module ==================================================================== */
const ValidationFactory = {
    fromType: (
        type: TransactionTypes | PseudoTransactionTypes,
    ): ValidationType<TransactionsType | PseudoTransactionsType> => {
        let explainer;

        switch (true) {
            // Genuine transaction
            case type in TransactionTypes:
                explainer = get(Transactions, `${type}Info`, undefined);
                break;
            // Pseudo transaction
            case type in PseudoTransactionTypes:
                explainer = get(PseudoTransactions, `${type}Info`, undefined);
                break;
            default:
                break;
        }

        if (typeof explainer === 'undefined') {
            throw new Error(`Validation "${type}Validation" not found. Did you forget to include it?`);
        }

        return explainer;
    },
};

/* Export ==================================================================== */
export default ValidationFactory;
