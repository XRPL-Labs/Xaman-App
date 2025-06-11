import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Blob, Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class NFTokenModify extends BaseGenuineTransaction {
    public static Type = TransactionTypes.NFTokenModify as const;
    public readonly Type = NFTokenModify.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        NFTokenID: { required: true, type: Hash256 },
        Owner: { type: AccountID },
        URI: { type: Blob },
    };

    declare NFTokenID: FieldReturnType<typeof Hash256>;
    declare Owner: FieldReturnType<typeof AccountID>;
    declare URI: FieldReturnType<typeof Blob>;

    constructor(tx?: TransactionJson, meta?: any) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = NFTokenModify.Type;
    }
}

/* Export ==================================================================== */
export default NFTokenModify;
