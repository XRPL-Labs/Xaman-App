import BaseGenuineTransaction from '@common/libs/ledger/transactions/genuine/base';

import { Hash256, UInt32 } from '@common/libs/ledger/parser/fields';

/* Types ==================================================================== */
import { TransactionJson, TransactionMetadata } from '@common/libs/ledger/types/transaction';
import { TransactionTypes } from '@common/libs/ledger/types/enums';
import { FieldConfig, FieldReturnType } from '@common/libs/ledger/parser/fields/types';

/* Class ==================================================================== */
class EnableAmendment extends BaseGenuineTransaction {
    public static Type = TransactionTypes.EnableAmendment as const;
    public readonly Type = EnableAmendment.Type;

    public static Fields: { [key: string]: FieldConfig } = {
        Amendment: { type: Hash256 },
        LedgerSequence: { type: UInt32 },
    };

    declare Amendment: FieldReturnType<typeof Hash256>;
    declare LedgerSequence: FieldReturnType<typeof UInt32>;

    constructor(tx?: TransactionJson, meta?: TransactionMetadata) {
        super(tx, meta);

        // set transaction type
        this.TransactionType = EnableAmendment.Type;
    }
}

/* Export ==================================================================== */
export default EnableAmendment;
