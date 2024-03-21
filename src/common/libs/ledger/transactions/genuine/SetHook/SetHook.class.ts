import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { STArray } from '@common/libs/ledger/parser/fields';
/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class SetHook extends BaseGenuineTransaction {
    public static Type = TransactionTypes.SetHook as const;
    public readonly Type = SetHook.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Hooks: { required: true, type: STArray },
    };

    declare Hooks: FieldReturnType<typeof STArray>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = SetHook.Type;
    }
}

/* Export ==================================================================== */
export default SetHook;
