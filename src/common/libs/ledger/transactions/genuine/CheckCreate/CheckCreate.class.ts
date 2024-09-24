import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { AccountID, Amount, UInt32, Hash256 } from '@common/libs/ledger/parser/fields';
import { RippleTime } from '@common/libs/ledger/parser/fields/codec';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class CheckCreate extends BaseGenuineTransaction {
    public static Type = TransactionTypes.CheckCreate as const;
    public readonly Type = CheckCreate.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Destination: { required: true, type: AccountID },
        DestinationTag: { required: true, type: UInt32 },
        SendMax: { required: true, type: Amount },
        Expiration: { type: UInt32, codec: RippleTime },
        InvoiceID: { type: Hash256 },
    };

    declare Destination: FieldReturnType<typeof AccountID>;
    declare DestinationTag: FieldReturnType<typeof UInt32>;
    declare SendMax: FieldReturnType<typeof Amount>;
    declare Expiration: FieldReturnType<typeof UInt32, typeof RippleTime>;
    declare InvoiceID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = CheckCreate.Type;
    }
}

/* Export ==================================================================== */
export default CheckCreate;
