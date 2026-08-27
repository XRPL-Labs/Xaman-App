import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Amount } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class Clawback extends BaseGenuineTransaction {
    public static Type = TransactionTypes.Clawback as const;
    public readonly Type = Clawback.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Amount: { type: Amount },
        Holder: { type: AccountID },
    };

    declare Amount: FieldReturnType<typeof Amount>;
    declare Holder: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = Clawback.Type;
    }
}

/* Export ==================================================================== */
export default Clawback;
