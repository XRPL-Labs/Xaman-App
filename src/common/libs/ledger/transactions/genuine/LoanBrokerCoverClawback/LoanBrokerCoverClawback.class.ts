import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, Amount } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class LoanBrokerCoverClawback extends BaseGenuineTransaction {
    public static Type = TransactionTypes.LoanBrokerCoverClawback as const;
    public readonly Type = LoanBrokerCoverClawback.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        LoanBrokerID: { type: Hash256 },
        Amount: { type: Amount },
    };

    declare LoanBrokerID: FieldReturnType<typeof Hash256>;
    declare Amount: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = LoanBrokerCoverClawback.Type;
    }
}

/* Export ==================================================================== */
export default LoanBrokerCoverClawback;
