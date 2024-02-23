import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { Amount, UInt16 } from '@common/libs/ledger/parser/fields';
import { TradingFee } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class AMMCreate extends BaseTransaction {
    public static Type = TransactionTypes.AMMCreate as const;
    public readonly Type = AMMCreate.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Amount: { type: Amount },
        Amount2: { type: Amount },
        TradingFee: { type: UInt16, codec: TradingFee },
    };

    declare Amount: FieldReturnType<typeof Amount>;
    declare Amount2: FieldReturnType<typeof Amount>;
    declare TradingFee: FieldReturnType<typeof UInt16, typeof TradingFee>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = AMMCreate.Type;
    }
}

/* Export ==================================================================== */
export default AMMCreate;
