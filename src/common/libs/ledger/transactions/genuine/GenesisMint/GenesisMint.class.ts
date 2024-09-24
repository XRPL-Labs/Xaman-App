import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { STArray } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class GenesisMint extends BaseGenuineTransaction {
    public static Type = TransactionTypes.GenesisMint as const;
    public readonly Type = GenesisMint.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        GenesisMints: { readonly: true, type: STArray },
    };

    declare GenesisMints: FieldReturnType<typeof STArray>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = GenesisMint.Type;
    }
}

/* Export ==================================================================== */
export default GenesisMint;
