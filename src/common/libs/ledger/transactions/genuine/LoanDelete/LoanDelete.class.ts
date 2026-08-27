import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class LoanDelete extends BaseGenuineTransaction {
    public static Type = TransactionTypes.LoanDelete as const;
    public readonly Type = LoanDelete.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        LoanID: { required: true, type: Hash256 },
    };

    declare LoanID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = LoanDelete.Type;
    }
}

/* Export ==================================================================== */
export default LoanDelete;
