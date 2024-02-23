import BaseTransaction from '@common/libs/ledger/transactions/BaseTransaction';

import { Hash256, UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class OfferCancel extends BaseTransaction {
    public static Type = TransactionTypes.OfferCancel as const;
    public readonly Type = OfferCancel.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        OfferSequence: { type: UInt32 },
        OfferID: { type: Hash256 },
    };

    declare OfferSequence: FieldReturnType<typeof UInt32>;
    declare OfferID: FieldReturnType<typeof Hash256>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = OfferCancel.Type;
    }
}

/* Export ==================================================================== */
export default OfferCancel;
