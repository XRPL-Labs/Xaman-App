import { get } from 'lodash';

import { AccountModel } from '@store/models';

import * as Transactions from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactions from '@common/libs/ledger/transactions/pseudo';
import * as LedgerObjects from '@common/libs/ledger/objects';

/* Types ==================================================================== */
import { LedgerObjectTypes, PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types';

import {
    PseudoTransactions as PseudoTransactionsType,
    Transactions as TransactionsType,
} from '@common/libs/ledger/transactions/types';

import { LedgerObjects as LedgerObjectsType } from '@common/libs/ledger/objects/types';

type ExplainerType<T> = {
    getLabel(tx: T, account: AccountModel): string;
    getDescription(item: T, account: AccountModel): string;
    getRecipient(item: T, account: AccountModel): { address: string; tag?: number };
};

/* Module ==================================================================== */
const ExplainerFactory = {
    fromType: (
        type: TransactionTypes | PseudoTransactionTypes | LedgerObjectTypes,
    ): ExplainerType<TransactionsType | PseudoTransactionsType | LedgerObjectsType> => {
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
            // Ledger object
            case type in LedgerObjectTypes:
                explainer = get(LedgerObjects, `${type}Info`, undefined);
                break;
            default:
                break;
        }

        if (typeof explainer === 'undefined') {
            throw new Error(`Explainer "${type}Info" not found. Did you forget to include it?`);
        }

        return explainer;
    },
};

/* Export ==================================================================== */
export default ExplainerFactory;
