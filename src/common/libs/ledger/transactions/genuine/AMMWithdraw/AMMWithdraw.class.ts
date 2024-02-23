import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { Issue, Amount } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class AMMWithdraw extends BaseTransaction {
    public static Type = TransactionTypes.AMMWithdraw as const;
    public readonly Type = AMMWithdraw.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Asset: { type: Issue },
        Asset2: { type: Issue },
        Amount: { type: Amount },
        Amount2: { type: Amount },
        EPrice: { type: Amount },
        LPTokenIn: { type: Amount },
    };

    declare Asset: FieldReturnType<typeof Issue>;
    declare Asset2: FieldReturnType<typeof Issue>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Amount2: FieldReturnType<typeof Amount>;
    declare EPrice: FieldReturnType<typeof Amount>;
    declare LPTokenIn: FieldReturnType<typeof Amount>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = AMMWithdraw.Type;
    }
}

/* Export ==================================================================== */
export default AMMWithdraw;
