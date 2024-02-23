import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { AccountID } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class DepositPreauth extends BaseTransaction {
    public static Type = TransactionTypes.DepositPreauth as const;
    public readonly Type = DepositPreauth.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Authorize: { type: AccountID },
        Unauthorize: { type: AccountID },
    };

    declare Authorize: FieldReturnType<typeof AccountID>;
    declare Unauthorize: FieldReturnType<typeof AccountID>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = DepositPreauth.Type;
    }
}

/* Export ==================================================================== */
export default DepositPreauth;
