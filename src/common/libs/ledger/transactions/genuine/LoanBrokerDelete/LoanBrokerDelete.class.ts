import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class LoanBrokerDelete extends BaseGenuineTransaction {
    public static Type = TransactionTypes.LoanBrokerDelete as const;
    public readonly Type = LoanBrokerDelete.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        LoanBrokerID: { required: true, type: Hash256 },
    };

    declare LoanBrokerID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = LoanBrokerDelete.Type;
    }
}

/* Export ==================================================================== */
export default LoanBrokerDelete;
