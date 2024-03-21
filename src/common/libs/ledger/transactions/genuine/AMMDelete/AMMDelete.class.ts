import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Issue } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class AMMDelete extends BaseGenuineTransaction {
    public static Type = TransactionTypes.AMMDelete as const;
    public readonly Type = AMMDelete.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Asset: { type: Issue },
        Asset2: { type: Issue },
    };

    declare Asset: FieldReturnType<typeof Issue>;
    declare Asset2: FieldReturnType<typeof Issue>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = AMMDelete.Type;
    }
}

/* Export ==================================================================== */
export default AMMDelete;
