import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class SetRegularKey extends BaseGenuineTransaction {
    public static Type = TransactionTypes.SetRegularKey as const;
    public readonly Type = SetRegularKey.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        RegularKey: { type: AccountID },
    };

    declare RegularKey: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = SetRegularKey.Type;
    }
}

/* Export ==================================================================== */
export default SetRegularKey;
