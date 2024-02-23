import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { AccountID, Hash256 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class NFTokenBurn extends BaseTransaction {
    public static Type = TransactionTypes.NFTokenBurn as const;
    public readonly Type = NFTokenBurn.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        NFTokenID: { required: true, type: Hash256 },
        Owner: { type: AccountID },
    };

    declare NFTokenID: FieldReturnType<typeof Hash256>;
    declare Owner: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: any) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = NFTokenBurn.Type;
    }
}

/* Export ==================================================================== */
export default NFTokenBurn;
