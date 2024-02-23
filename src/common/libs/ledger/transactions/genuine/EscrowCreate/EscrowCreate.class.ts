import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { AccountID, Amount, Blob, UInt32 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class EscrowCreate extends BaseTransaction {
    public static Type = TransactionTypes.EscrowCreate as const;
    public readonly Type = EscrowCreate.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Amount: { required: true, type: Amount },
        Destination: { required: true, type: AccountID },
        DestinationTag: { type: UInt32 },
        CancelAfter: { type: UInt32, codec: RippleTime },
        FinishAfter: { type: UInt32, codec: RippleTime },
        Condition: { type: Blob },
    };

    declare Amount: FieldReturnType<typeof Amount>;
    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;
    declare CancelAfter: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare FinishAfter: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare Condition: FieldReturnType<typeof Blob>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = EscrowCreate.Type;
    }
}

/* Export ==================================================================== */
export default EscrowCreate;
