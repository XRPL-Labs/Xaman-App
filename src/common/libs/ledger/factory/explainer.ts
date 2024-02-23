import { get } from 'lodash';

import * as Transactions from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactions from '@common/libs/ledger/transactions/pseudo';
import * as LedgerObjects from '@common/libs/ledger/objects';

import { AccountModel } from '@store/models/objects';

/* Types ==================================================================== */
import { LedgerEntryTypes, PseudoTransactionTypes, TransactionTypes } from '@common/libs/ledger/types/enums';
import {
    PseudoTransactions as PseudoTransactionsType,
    Transactions as TransactionsType,
} from '@common/libs/ledger/transactions/types';
import { LedgerObjects as LedgerObjectsType } from '@common/libs/ledger/objects/types';
import { ExplainerAbstract } from '@common/libs/ledger/factory/types';

/* Module ==================================================================== */
const ExplainerFactory = {
    fromType: (
        type: TransactionTypes | PseudoTransactionTypes | LedgerEntryTypes,
    ):
        | (new (...args: any[]) => ExplainerAbstract<TransactionsType | PseudoTransactionsType | LedgerObjectsType>)
        | undefined => {
        let Explainer;

        switch (true) {
            // Genuine transaction
            case type in TransactionTypes:
                Explainer = get(Transactions, `${type}Info`, undefined);
                break;
            // Pseudo transaction
            case type in PseudoTransactionTypes:
                Explainer = get(PseudoTransactions, `${type}Info`, undefined);
                break;
            // Ledger object
            case type in LedgerEntryTypes:
                Explainer = get(LedgerObjects, `${type}Info`, undefined);
                break;
            default:
                break;
        }

        if (typeof Explainer === 'undefined') {
            console.warn(`Explainer "${type}Info" not found. Did you forget to include it?`);
        }

        return Explainer;
    },
    fromItem: (
        item: TransactionsType | PseudoTransactionsType | LedgerObjectsType,
        account: AccountModel,
    ): ExplainerAbstract<TransactionsType | PseudoTransactionsType | LedgerObjectsType> | undefined => {
        const Explainer = ExplainerFactory.fromType(item.Type);

        if (typeof Explainer === 'undefined') {
            return undefined;
        }

        return new Explainer(item, account);
    },
};

/* Export ==================================================================== */
export default ExplainerFactory;
