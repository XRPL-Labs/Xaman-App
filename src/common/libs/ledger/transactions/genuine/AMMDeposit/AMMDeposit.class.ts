import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Amount, Issue, UInt16 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class AMMDeposit extends BaseGenuineTransaction {
    public static Type = TransactionTypes.AMMDeposit as const;
    public readonly Type = AMMDeposit.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Asset: { type: Issue },
        Asset2: { type: Issue },
        Amount: { type: Amount },
        Amount2: { type: Amount },
        EPrice: { type: Amount },
        LPTokenOut: { type: Amount },
        TradingFee: { type: UInt16 },
    };

    declare Asset: FieldReturnType<typeof Issue>;
    declare Asset2: FieldReturnType<typeof Issue>;
    declare Amount: FieldReturnType<typeof Amount>;
    declare Amount2: FieldReturnType<typeof Amount>;
    declare EPrice: FieldReturnType<typeof Amount>;
    declare LPTokenOut: FieldReturnType<typeof Amount>;
    declare TradingFee: FieldReturnType<typeof UInt16>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = AMMDeposit.Type;
    }
}

/* Export ==================================================================== */
export default AMMDeposit;
