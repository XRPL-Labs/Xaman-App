import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, STArray } from '@common/libs/ledger/parser/fields';
/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';
import { Remarks } from '@common/libs/ledger/parser/fields/codec';

/* Class ==================================================================== */
class SetRemarks extends BaseGenuineTransaction {
    public static Type = TransactionTypes.SetRemarks as const;
    public readonly Type = SetRemarks.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        ObjectID: { required: true, type: Hash256 },
        Remarks: { required: true, type: STArray, codec: Remarks },
    };

    declare ObjectID: FieldReturnType<typeof Hash256>;
    declare Remarks: FieldReturnType<typeof STArray>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = SetRemarks.Type;
    }
}

/* Export ==================================================================== */
export default SetRemarks;
