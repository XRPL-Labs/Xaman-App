import { get } from 'lodash';

import { AccountModel } from '@store/models';

import * as Transactions from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactions from '@common/libs/ledger/transactions/pseudo';

/* Types ==================================================================== */
import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types/enums';

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
        let validator;

        switch (true) {
            // Genuine transaction
            case type in TransactionTypes:
                validator = get(Transactions, `${type}Validation`, undefined);
                break;
            // Pseudo transaction
            case type in PseudoTransactionTypes:
                validator = get(PseudoTransactions, `${type}Validation`, undefined);
                break;
            default:
                break;
        }

        if (typeof validator === 'undefined') {
            throw new Error(`Validation "${type}Validation" not found. Did you forget to include it?`);
        }

        return validator;
    },
};

/* Export ==================================================================== */
export default ValidationFactory;
