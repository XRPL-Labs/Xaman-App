import * as TransactionInstances from '@common/libs/ledger/transactions/genuine';
import * as PseudoTransactionsInstances from '@common/libs/ledger/transactions/pseudo';

import { FallbackTransactionValidation } from '@common/libs/ledger/transactions/fallback';

/* Types ==================================================================== */
import {
    FallbackTypes,
    InstanceTypes,
    PseudoTransactionTypes,
    TransactionTypes,
} from '@common/libs/ledger/types/enums';
import { CombinedTransactions } from '@common/libs/ledger/transactions/types';
import { ValidationType } from '@common/libs/ledger/factory/types';

/* Module ==================================================================== */

const ValidationFactory = {
    fromTransaction: (item: CombinedTransactions): ValidationType<CombinedTransactions> => {
        let Validation: ValidationType<any> | undefined;

        const ValidtionInstanceName = `${item.Type}Validation`;

        if (
            item.InstanceType === InstanceTypes.FallbackTransaction &&
            item.Type === FallbackTypes.FallbackTransaction
        ) {
            return FallbackTransactionValidation as ValidationType<any>;
        }

        if (item.Type in TransactionTypes && Object.keys(TransactionInstances).includes(ValidtionInstanceName)) {
            Validation = (TransactionInstances as any)[ValidtionInstanceName] as ValidationType<any>;
        }

        if (
            item.Type in PseudoTransactionTypes &&
            Object.keys(PseudoTransactionsInstances).includes(ValidtionInstanceName)
        ) {
            Validation = (PseudoTransactionsInstances as any)[ValidtionInstanceName] as ValidationType<any>;
        }

        if (typeof Validation === 'undefined') {
            throw new Error(`Explainer "${item.Type}Validation" not found, forgot to include it?`);
        }

        return Validation;
    },
};

/* Export ==================================================================== */
export default ValidationFactory;
