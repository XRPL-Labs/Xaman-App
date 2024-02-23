import { get } from 'lodash';

import * as Transactions from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactions from '@common/libs/ledger/transactions/pseudo';

/* Types ==================================================================== */
import { PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types/enums';
import {
    Transactions as TransactionsType,
    PseudoTransactions as PseudoTransactionsType,
} from '@common/libs/ledger/transactions/types';
import { ValidationType } from '@common/libs/ledger/factory/types';

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

        // TODO: fix typing here
        // @ts-ignore
        return validator;
    },
};

/* Export ==================================================================== */
export default ValidationFactory;
